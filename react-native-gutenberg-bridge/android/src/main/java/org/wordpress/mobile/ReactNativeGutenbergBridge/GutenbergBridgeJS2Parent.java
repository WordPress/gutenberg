package org.wordpress.mobile.ReactNativeGutenbergBridge;

interface GutenbergBridgeLogger {
    void debug(String message);
    void info(String message);
    void log(String message);
    void warn(String message);
    void error(String message);
}

public interface GutenbergBridgeJS2Parent extends GutenbergBridgeLogger {
    void responseHtml(String title, String html, boolean changed);

    void editorDidMount(boolean hasUnsupportedBlocks);

    interface MediaSelectedCallback {
        void onMediaSelected(int mediaId, String mediaUrl);
    }

    interface MediaUploadCallback {
        void onUploadMediaFileSelected(int mediaId, String mediaUri);
        void onUploadMediaFileClear(int mediaId);
        void onMediaFileUploadProgress(int mediaId, float progress);
        void onMediaFileUploadSucceeded(int mediaId, String mediaUrl, int serverId);
        void onMediaFileUploadFailed(int mediaId);
    }

    void requestMediaPickFromMediaLibrary(MediaSelectedCallback mediaSelectedCallback);

    void requestMediaPickFromDeviceLibrary(MediaUploadCallback mediaUploadCallback);

    void requestMediaPickerFromDeviceCamera(MediaUploadCallback mediaUploadCallback);

    void mediaUploadSync(MediaUploadCallback mediaUploadCallback);

    void requestImageFailedRetryDialog(int mediaId);

    void requestImageUploadCancelDialog(int mediaId);
}
