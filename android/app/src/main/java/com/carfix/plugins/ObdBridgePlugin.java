package com.carfix.plugins;

import android.Manifest;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;
import android.content.pm.PackageManager;
import android.os.Build;
import androidx.core.app.ActivityCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.InputStream;
import java.io.OutputStream;
import java.io.IOException;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Production Native Android Capacitor Plugin for OBDLink MX+
 * Handles RFCOMM Bluetooth Classic socket stream I/O over SPP UUID.
 */
@CapacitorPlugin(
    name = "ObdBridge",
    permissions = {
        @Permission(strings = { Manifest.permission.BLUETOOTH_CONNECT }, alias = "btConnect"),
        @Permission(strings = { Manifest.permission.BLUETOOTH_SCAN }, alias = "btScan")
    }
)
public class ObdBridgePlugin extends Plugin {

    // Standard SPP (Serial Port Profile) UUID used by OBDLink MX+ and STN adapters
    private static final UUID SPP_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");

    private BluetoothAdapter bluetoothAdapter;
    private BluetoothSocket socket;
    private InputStream inputStream;
    private OutputStream outputStream;
    private final ExecutorService ioExecutor = Executors.newSingleThreadExecutor();

    @Override
    public void load() {
        super.load();
        bluetoothAdapter = BluetoothAdapter.getDefaultAdapter();
    }

    @PluginMethod
    public void getPairedDevices(PluginCall call) {
        if (bluetoothAdapter == null || !bluetoothAdapter.isEnabled()) {
            call.reject("Bluetooth is disabled or unavailable.");
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (getPermissionState("btConnect") != PermissionState.GRANTED) {
                requestPermissionForAlias("btConnect", call, "getPairedDevicesCallback");
                return;
            }
        }

        fetchPairedDevicesInternal(call);
    }

    @PermissionCallback
    private void getPairedDevicesCallback(PluginCall call) {
        if (getPermissionState("btConnect") == PermissionState.GRANTED) {
            fetchPairedDevicesInternal(call);
        } else {
            call.reject("Bluetooth connect permission denied.");
        }
    }

    private void fetchPairedDevicesInternal(PluginCall call) {
        try {
            Set<BluetoothDevice> paired = bluetoothAdapter.getBondedDevices();
            JSArray devices = new JSArray();

            if (paired != null) {
                for (BluetoothDevice device : paired) {
                    JSObject devObj = new JSObject();
                    devObj.put("name", device.getName() != null ? device.getName() : "Unknown Device");
                    devObj.put("address", device.getAddress());
                    devices.put(devObj);
                }
            }

            JSObject result = new JSObject();
            result.put("devices", devices);
            call.resolve(result);
        } catch (SecurityException e) {
            call.reject("Bluetooth permission denied: " + e.getMessage());
        }
    }

    @PluginMethod
    public void connect(PluginCall call) {
        String address = call.getString("address", "");
        if (address.isEmpty()) {
            call.reject("Bluetooth MAC address must be provided.");
            return;
        }

        if (bluetoothAdapter == null || !bluetoothAdapter.isEnabled()) {
            call.reject("Bluetooth adapter is disabled or unavailable on device.");
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (getPermissionState("btConnect") != PermissionState.GRANTED || getPermissionState("btScan") != PermissionState.GRANTED) {
                requestAllPermissions(call, "connectCallback");
                return;
            }
        }

        connectInternal(call, address);
    }

    @PermissionCallback
    private void connectCallback(PluginCall call) {
        if (getPermissionState("btConnect") == PermissionState.GRANTED) {
            String address = call.getString("address", "");
            connectInternal(call, address);
        } else {
            call.reject("Bluetooth permissions denied.");
        }
    }

    private void connectInternal(PluginCall call, String address) {
        ioExecutor.execute(() -> {
            try {
                if (socket != null && socket.isConnected()) {
                    disconnectInternal();
                }

                BluetoothDevice device = bluetoothAdapter.getRemoteDevice(address);
                socket = device.createRfcommSocketToServiceRecord(SPP_UUID);

                try {
                    bluetoothAdapter.cancelDiscovery();
                } catch (SecurityException ignored) {
                }

                socket.connect();
                inputStream = socket.getInputStream();
                outputStream = socket.getOutputStream();

                JSObject ret = new JSObject();
                ret.put("connected", true);
                ret.put("adapter", device.getName() != null ? device.getName() : "OBDLink MX+");
                ret.put("address", address);
                call.resolve(ret);
            } catch (Exception e) {
                disconnectInternal();
                call.reject("Failed to connect to OBDLink MX+: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void sendRawCommand(PluginCall call) {
        String command = call.getString("command", "");
        int timeoutMs = call.getInt("timeoutMs", 3000);

        if (socket == null || !socket.isConnected() || inputStream == null || outputStream == null) {
            call.reject("OBD adapter is not connected.");
            return;
        }

        ioExecutor.execute(() -> {
            try {
                OutputStream out = outputStream;
                InputStream in = inputStream;
                BluetoothSocket s = socket;
                if (out == null || in == null || s == null || !s.isConnected()) {
                    call.reject("OBD adapter is not connected.");
                    return;
                }

                // Ensure carriage return at end of command
                String formattedCommand = command.trim() + "\r";
                out.write(formattedCommand.getBytes("UTF-8"));
                out.flush();

                // Read buffer until standard STN/ELM prompt '>' character or timeout
                StringBuilder sb = new StringBuilder();
                byte[] buffer = new byte[256];
                long startTime = System.currentTimeMillis();

                while ((System.currentTimeMillis() - startTime) < timeoutMs) {
                    if (socket == null || inputStream == null || !s.isConnected()) {
                        call.reject("OBD adapter disconnected.");
                        return;
                    }
                    if (in.available() > 0) {
                        int bytesRead = in.read(buffer);
                        if (bytesRead > 0) {
                            String chunk = new String(buffer, 0, bytesRead, "UTF-8");
                            sb.append(chunk);
                            if (sb.toString().contains(">")) {
                                break;
                            }
                        }
                    } else {
                        Thread.sleep(20);
                    }
                }

                String rawResponse = sb.toString().replace(">", "").trim();
                JSObject ret = new JSObject();
                ret.put("response", rawResponse);
                ret.put("command", command);
                call.resolve(ret);
            } catch (Exception e) {
                call.reject("Serial communication error: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void disconnect(PluginCall call) {
        disconnectInternal();
        JSObject ret = new JSObject();
        ret.put("connected", false);
        call.resolve(ret);
    }

    private synchronized void disconnectInternal() {
        try {
            if (inputStream != null) inputStream.close();
        } catch (IOException ignored) {}
        try {
            if (outputStream != null) outputStream.close();
        } catch (IOException ignored) {}
        try {
            if (socket != null) socket.close();
        } catch (IOException ignored) {}
        inputStream = null;
        outputStream = null;
        socket = null;
    }

    @Override
    protected void handleOnDestroy() {
        disconnectInternal();
        ioExecutor.shutdown();
        super.handleOnDestroy();
    }
}
