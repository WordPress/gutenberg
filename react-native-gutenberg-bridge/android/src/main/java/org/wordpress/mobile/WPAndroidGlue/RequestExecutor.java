package org.wordpress.mobile.WPAndroidGlue;

import androidx.core.util.Consumer;

import java.util.Map;

public interface RequestExecutor {
    void performRequest(String path, Consumer<String> onSuccess, Consumer<Map<String, Object>> onError);
}
