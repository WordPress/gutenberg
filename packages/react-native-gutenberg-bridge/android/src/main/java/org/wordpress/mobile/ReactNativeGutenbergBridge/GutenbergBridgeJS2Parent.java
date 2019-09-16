package org.wordpress.mobile.ReactNativeGutenbergBridge;

import com.facebook.react.bridge.ReadableArray;

public interface GutenbergBridgeJS2Parent {
    void responseHtml(String title, String html, boolean changed);

    void editorDidMount(ReadableArray unsupportedBlockNames);

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

    enum MediaType {
        IMAGE("image"),
        VIDEO("video"),
        AUDIO("audio"),
        OTHER("other");

        String name;

        MediaType(String name) {
            this.name = name;
        }

        public static MediaType getEnum(String value) {
            for (MediaType mediaType : values()) {
                if (mediaType.name.equals(value)) {
                    return mediaType;
                }
            }

            return OTHER;
        }
    }

    void requestMediaPickFromMediaLibrary(MediaSelectedCallback mediaSelectedCallback, MediaType mediaType);

    void requestMediaPickFromDeviceLibrary(MediaUploadCallback mediaUploadCallback, MediaType mediaType);

    void requestMediaPickerFromDeviceCamera(MediaUploadCallback mediaUploadCallback, MediaType mediaType);

    void requestMediaImport(String url, MediaSelectedCallback mediaSelectedCallback);

    void mediaUploadSync(MediaUploadCallback mediaUploadCallback);

    void requestImageFailedRetryDialog(int mediaId);

    void requestImageUploadCancelDialog(int mediaId);

    void requestImageUploadCancel(int mediaId);

    void editorDidEmitLog(String message, LogLevel logLevel);
}
