package org.wordpress.mobile.ReactNativeGutenbergBridge.NativeNotice;

import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import org.wordpress.mobile.ReactNativeGutenbergBridge.GutenbergBridgeJS2Parent;

import java.util.HashMap;
import java.util.Map;

public class NativeNoticeModule extends ReactContextBaseJavaModule {

    private final GutenbergBridgeJS2Parent mGutenbergBridgeJS2Parent;

    public NativeNoticeModule(@Nullable ReactApplicationContext reactContext,
                              GutenbergBridgeJS2Parent mGutenbergBridgeJS2Parent) {
        super(reactContext);
        this.mGutenbergBridgeJS2Parent = mGutenbergBridgeJS2Parent;
    }

    @NonNull
    @Override
    public String getName() {
        return "NativeNoticeModule";
    }

    @Nullable
    @Override
    public Map<String, Object> getConstants() {
        final HashMap<String, Object> constants = new HashMap<>();
        constants.put("LENGTH_LONG", Toast.LENGTH_LONG);
        constants.put("LENGTH_SHORT", Toast.LENGTH_SHORT);
        return constants;
    }

    @ReactMethod
    public void showNotice(String message, int duration) {
        this.mGutenbergBridgeJS2Parent.showNotice(message, duration);
    }

}
