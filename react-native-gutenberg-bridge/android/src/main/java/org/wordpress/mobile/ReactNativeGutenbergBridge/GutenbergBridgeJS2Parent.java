package org.wordpress.mobile.ReactNativeGutenbergBridge;

public interface GutenbergBridgeJS2Parent {
    void responseHtml(String html);

    interface MediaSelectedCallback {
        void onMediaSelected(String mediaUrl);
    }

    void onMediaLibraryPress(MediaSelectedCallback mediaSelectedCallback);
}
