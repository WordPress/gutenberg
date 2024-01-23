package org.wordpress.mobile.WPAndroidGlue;

import android.os.Bundle;

import androidx.core.util.Consumer;

import com.facebook.react.bridge.ReadableMap;

public interface RequestExecutor {
    void performGetRequest(String path, boolean enableCaching, Consumer<String> onSuccess, Consumer<Bundle> onError);
    void performPostRequest(String path, ReadableMap data, Consumer<String> onSuccess, Consumer<Bundle> onError);
}
