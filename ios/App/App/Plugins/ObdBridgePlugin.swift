import Foundation
import ExternalAccessory
import Capacitor

/**
 * Production Native iOS Capacitor Plugin for OBDLink MX+
 * Handles MFi ExternalAccessory protocol stream I/O over EASession streams.
 */
@objc(ObdBridgePlugin)
public class ObdBridgePlugin: CAPPlugin, StreamDelegate {

    private var session: EASession?
    private var inputStream: InputStream?
    private var outputStream: OutputStream?
    private var responseBuffer = Data()
    private let serialQueue = DispatchQueue(label: "com.carfix.obdbridge.queue", qos: .userInitiated)

    @objc func connect(_ call: CAPPluginCall) {
        let protocolString = call.getString("protocol") ?? "com.obdlink.mx"

        serialQueue.async { [weak self] in
            guard let self = self else { return }

            let connectedAccessories = EAAccessoryManager.shared().connectedAccessories
            guard let accessory = connectedAccessories.first(where: { $0.protocolStrings.contains(protocolString) || $0.name.contains("OBDLink") }) else {
                call.reject("OBDLink MX+ accessory not paired or connected in iOS Settings.")
                return
            }

            guard let newSession = EASession(accessory: accessory, forProtocol: protocolString) else {
                call.reject("Failed to establish EASession with OBDLink accessory.")
                return
            }

            self.session = newSession
            self.inputStream = newSession.inputStream
            self.outputStream = newSession.outputStream

            self.inputStream?.delegate = self
            self.outputStream?.delegate = self

            self.inputStream?.schedule(in: .current, forMode: .default)
            self.outputStream?.schedule(in: .current, forMode: .default)

            self.inputStream?.open()
            self.outputStream?.open()

            call.resolve([
                "connected": true,
                "adapter": accessory.name,
                "firmware": accessory.firmwareRevision
            ])
        }
    }

    @objc func sendRawCommand(_ call: CAPPluginCall) {
        let command = call.getString("command") ?? ""
        let timeoutMs = call.getInt("timeoutMs") ?? 3000

        serialQueue.async { [weak self] in
            guard let self = self, let outputStream = self.outputStream, let inputStream = self.inputStream else {
                call.reject("OBD adapter is not connected.")
                return
            }

            let formatted = command.trimmingCharacters(in: .whitespacesAndNewlines) + "\r"
            guard let dataToSend = formatted.data(using: .utf8) else {
                call.reject("Failed to encode command string.")
                return
            }

            _ = dataToSend.withUnsafeBytes { ptr in
                outputStream.write(ptr.bindMemory(to: UInt8.self).baseAddress!, maxLength: dataToSend.count)
            }

            var responseData = Data()
            let bufferSize = 256
            let buffer = UnsafeMutablePointer<UInt8>.allocate(capacity: bufferSize)
            defer { buffer.deallocate() }

            let startTime = Date()

            while Date().timeIntervalSince(startTime) < (Double(timeoutMs) / 1000.0) {
                if inputStream.hasBytesAvailable {
                    let readBytes = inputStream.read(buffer, maxLength: bufferSize)
                    if readBytes > 0 {
                        responseData.append(buffer, count: readBytes)
                        if let str = String(data: responseData, encoding: .utf8), str.contains(">") {
                            break
                        }
                    }
                } else {
                    Thread.sleep(forTimeInterval: 0.02)
                }
            }

            let rawResponse = String(data: responseData, encoding: .utf8)?.replacingOccurrences(of: ">", with: "").trimmingCharacters(in: .whitespacesAndNewlines) ?? ""

            call.resolve([
                "response": rawResponse,
                "command": command
            ])
        }
    }

    @objc func disconnect(_ call: CAPPluginCall) {
        serialQueue.async { [weak self] in
            self?.closeSession()
            call.resolve(["connected": false])
        }
    }

    private func closeSession() {
        inputStream?.close()
        outputStream?.close()
        inputStream?.remove(from: .current, forMode: .default)
        outputStream?.remove(from: .current, forMode: .default)
        inputStream = nil
        outputStream = nil
        session = nil
    }

    deinit {
        closeSession()
    }
}
