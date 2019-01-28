package org.wordpress.mobile.ReactNativeGutenbergBridge;

public interface GutenbergBridgeJS2Parent {
    void responseHtml(String title, String html, boolean changed);

    interface MediaSelectedCallback {
        void onMediaSelected(String mediaUrl);
    }

    interface MediaUploadCallback {
        void onUploadMediaFileSelected(int mediaId, String mediaUri);
        void onMediaFileUploadProgress(int mediaId, float progress);
        void onMediaFileUploadSucceeded(int mediaId, String mediaUrl, int serverId);
        void onMediaFileUploadFailed(int mediaId);
    }

    void onMediaLibraryPressed(MediaSelectedCallback mediaSelectedCallback);

    void onUploadMediaPressed(MediaUploadCallback mediaUploadCallback);
    
    void onCapturePhotoPressed(MediaUploadCallback mediaUploadCallback);

    void onImageQueryReattach(MediaUploadCallback mediaUploadCallback);
}
