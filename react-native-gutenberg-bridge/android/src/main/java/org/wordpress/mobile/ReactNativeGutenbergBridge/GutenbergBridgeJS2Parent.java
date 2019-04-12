package org.wordpress.mobile.ReactNativeGutenbergBridge;

public interface GutenbergBridgeJS2Parent {
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

    // Ref: https://github.com/facebook/react-native/blob/master/Libraries/polyfills/console.js#L376
    enum LogLevel {
        TRACE(0),
        INFO(1),
        WARN(2),
        ERROR(3);

        private final int id;

        LogLevel(int id) {
            this.id = id;
        }

        public static LogLevel valueOf(int id) {
            for (LogLevel num : values()) {
                if (num.id == id) {
                    return num;
                }
            }
            return null;
        }
    }

    void requestMediaPickFromMediaLibrary(MediaSelectedCallback mediaSelectedCallback);

    void requestMediaPickFromDeviceLibrary(MediaUploadCallback mediaUploadCallback);

    void requestMediaPickerFromDeviceCamera(MediaUploadCallback mediaUploadCallback);

    void requestMediaImport(String url, MediaSelectedCallback mediaSelectedCallback);

    void mediaUploadSync(MediaUploadCallback mediaUploadCallback);

    void requestImageFailedRetryDialog(int mediaId);

    void requestImageUploadCancelDialog(int mediaId);

    void requestImageUploadCancel(int mediaId);

    void editorDidEmitLog(String message, LogLevel logLevel);
}
