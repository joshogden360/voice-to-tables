package com.voicetotables.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.util.Log;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebView;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final String TAG = "VoiceToTables";
    private static final int PERMISSION_REQUEST_CODE = 1001;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Request microphone permission immediately
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) 
                != PackageManager.PERMISSION_GRANTED) {
            Log.d(TAG, "Requesting RECORD_AUDIO permission");
            ActivityCompat.requestPermissions(this, 
                new String[]{Manifest.permission.RECORD_AUDIO}, 
                PERMISSION_REQUEST_CODE);
        } else {
            Log.d(TAG, "RECORD_AUDIO permission already granted");
        }
    }

    @Override
    public void onStart() {
        super.onStart();
        setupWebViewPermissions();
    }

    private void setupWebViewPermissions() {
        try {
            WebView webView = this.bridge.getWebView();
            
            if (webView != null) {
                Log.d(TAG, "Setting up WebView permissions handler");
                webView.setWebChromeClient(new WebChromeClient() {
                    @Override
                    public void onPermissionRequest(final PermissionRequest request) {
                        Log.d(TAG, "WebView permission request received");
                        
                        // Always grant WebView permission requests if Android permission is granted
                        if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.RECORD_AUDIO) 
                                == PackageManager.PERMISSION_GRANTED) {
                            Log.d(TAG, "Granting WebView permission request");
                            runOnUiThread(() -> request.grant(request.getResources()));
                        } else {
                            Log.d(TAG, "Denying WebView permission - Android permission not granted");
                            runOnUiThread(() -> request.deny());
                        }
                    }
                });
            } else {
                Log.e(TAG, "WebView is null!");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error setting up WebView permissions", e);
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        
        if (requestCode == PERMISSION_REQUEST_CODE) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                Log.d(TAG, "RECORD_AUDIO permission granted by user");
            } else {
                Log.d(TAG, "RECORD_AUDIO permission denied by user");
            }
        }
    }
}
