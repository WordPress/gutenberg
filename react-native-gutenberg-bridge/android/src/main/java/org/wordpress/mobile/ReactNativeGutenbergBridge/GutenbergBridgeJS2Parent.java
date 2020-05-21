package org.wordpress.mobile.ReactNativeGutenbergBridge;

import android.os.Bundle;
import android.os.Parcelable;

import androidx.annotation.Nullable;

import androidx.core.util.Consumer;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;

import org.wordpress.mobile.WPAndroidGlue.MediaOption;
import org.wordpress.mobile.WPAndroidGlue.RequestExecutor;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public interface GutenbergBridgeJS2Parent extends RequestExecutor {
    interface RNMedia {
        String getUrl();
        int getId();
        String getType();
        String getCaption();
        WritableMap toMap();
    }

    void responseHtml(String title, String html, boolean changed);

    void editorDidMount(ReadableArray unsupportedBlockNames);

    interface OtherMediaOptionsReceivedCallback {
        void onOtherMediaOptionsReceived(ArrayList<MediaOption> mediaList);
    }

    interface MediaUploadCallback {
        void onUploadMediaFileSelected(List<RNMedia> mediaList);
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
        MEDIA("media"),
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

    enum GutenbergUserEvent {
        EDITOR_SESSION_TEMPLATE_APPLY("editor_session_template_apply"),
        EDITOR_SESSION_TEMPLATE_PREVIEW("editor_session_template_preview");

        private static final Map<String, GutenbergUserEvent> MAP = new HashMap<>();

        static {
            for (GutenbergUserEvent event : values()) {
                MAP.put(event.name, event);
            }
        }

        String name;

        GutenbergUserEvent(String name) {
            this.name = name;
        }

        public static GutenbergUserEvent getEnum(String eventName) {
            return MAP.get(eventName);
        }
    }

    void requestMediaPickFromMediaLibrary(MediaUploadCallback mediaUploadCallback, Boolean allowMultipleSelection, MediaType mediaType);

    void requestMediaPickFromDeviceLibrary(MediaUploadCallback mediaUploadCallback, Boolean allowMultipleSelection, MediaType mediaType);

    void requestMediaPickerFromDeviceCamera(MediaUploadCallback mediaUploadCallback, MediaType mediaType);

    void requestMediaImport(String url, MediaUploadCallback mediaUploadCallback);

    void mediaUploadSync(MediaUploadCallback mediaUploadCallback);

    void requestImageFailedRetryDialog(int mediaId);

    void requestImageUploadCancelDialog(int mediaId);

    void requestImageUploadCancel(int mediaId);

    void editorDidEmitLog(String message, LogLevel logLevel);

    void editorDidAutosave();

    void getOtherMediaPickerOptions(OtherMediaOptionsReceivedCallback otherMediaOptionsReceivedCallback, MediaType mediaType);

    void requestMediaPickFrom(String mediaSource, MediaUploadCallback mediaUploadCallback, Boolean allowMultipleSelection);

    void requestImageFullscreenPreview(String mediaUrl);

    void requestMediaEditor(MediaUploadCallback mediaUploadCallback, String mediaUrl);

    void logUserEvent(GutenbergUserEvent gutenbergUserEvent, ReadableMap eventProperties);

    void onAddMention(Consumer<String> onSuccess);
}
