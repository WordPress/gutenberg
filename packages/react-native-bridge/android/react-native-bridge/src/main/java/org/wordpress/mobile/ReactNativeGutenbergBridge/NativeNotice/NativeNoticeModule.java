package org.wordpress.mobile.ReactNativeGutenbergBridge.NativeNotice;

import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.util.HashMap;
import java.util.Map;

public class NativeNoticeModule extends ReactContextBaseJavaModule {

    public NativeNoticeModule(@Nullable ReactApplicationContext reactContext) {
        super(reactContext);
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
        Toast.makeText(getCurrentActivity(), message, duration).show();
    }

}
