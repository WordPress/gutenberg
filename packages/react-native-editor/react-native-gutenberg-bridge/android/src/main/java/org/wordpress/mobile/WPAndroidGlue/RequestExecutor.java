package org.wordpress.mobile.WPAndroidGlue;

import androidx.core.util.Consumer;

public interface RequestExecutor {
    void performRequest(String path, Consumer<String> onSuccess, Consumer<String> onError);
}
