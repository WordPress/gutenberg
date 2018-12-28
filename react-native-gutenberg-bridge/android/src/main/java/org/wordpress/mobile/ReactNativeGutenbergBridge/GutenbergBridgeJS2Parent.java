package org.wordpress.mobile.ReactNativeGutenbergBridge;

public interface GutenbergBridgeJS2Parent {
    void responseHtml(String html, boolean changed);

    interface MediaSelectedCallback {
        void onMediaSelected(String mediaUrl);
    }

    interface MediaUploadCallback {
        void onUploadMediaFileSelected(String mediaId, String mediaUri);
        void onMediaFileUploadProgress(String mediaId, float progress);
        void onMediaFileUploadSucceeded(String mediaId, String mediaUrl);
        void onMediaFileUploadFailed(String mediaId);
    }

    void onMediaLibraryPress(MediaSelectedCallback mediaSelectedCallback);

    void onUploadMediaPress(MediaUploadCallback mediaUploadCallback);
}
