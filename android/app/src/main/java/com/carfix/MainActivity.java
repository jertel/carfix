package com.carfix;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.carfix.plugins.ObdBridgePlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ObdBridgePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
