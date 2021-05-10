package org.wordpress.mobile.WPAndroidGlue;

import android.os.Bundle;

import androidx.core.util.Consumer;

public interface RequestExecutor {
    void performRequest(String path, boolean enableCaching, Consumer<String> onSuccess, Consumer<Bundle> onError);
}
