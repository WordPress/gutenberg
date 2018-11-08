package org.wordpress.mobile.ReactNativeGutenbergBridge;

public interface GutenbergBridgeJS2Parent {
    void responseHtml(String html, boolean changed);

    interface MediaSelectedCallback {
        void onMediaSelected(String mediaUrl);
    }

    void onMediaLibraryPress(MediaSelectedCallback mediaSelectedCallback);
}
