package org.wordpress.mobile.ReactNativeGutenbergBridge;

import androidx.core.util.Consumer;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;

import org.wordpress.mobile.WPAndroidGlue.MediaOption;
import org.wordpress.mobile.WPAndroidGlue.RequestExecutor;

import java.util.ArrayList;
import java.util.List;

public interface GutenbergBridgeJS2Parent extends RequestExecutor {

    void responseHtml(String title, String html, boolean changed, ReadableMap contentInfo);

    void editorDidMount(ReadableArray unsupportedBlockNames);

    interface OtherMediaOptionsReceivedCallback {
        void onOtherMediaOptionsReceived(ArrayList<MediaOption> mediaList);
    }

    interface MediaSelectedCallback {
        void onMediaFileSelected(List<RNMedia> mediaList);
    }

    interface MediaUploadEventEmitter {
        void onUploadMediaFileClear(int mediaId);
        void onMediaFileUploadProgress(int mediaId, float progress);
        void onMediaFileUploadSucceeded(int mediaId, String mediaUrl, int serverId);
        void onMediaFileUploadFailed(int mediaId);
    }

    interface MediaSaveEventEmitter {
        void onSaveMediaFileClear(String mediaId);
        void onMediaFileSaveProgress(String mediaId, float progress);
        void onMediaFileSaveSucceeded(String mediaId, String mediaUrl);
        void onMediaFileSaveFailed(String mediaId);
        void onMediaCollectionSaveResult(String firstMediaIdInCollection, boolean success);
        void onMediaIdChanged(final String oldId, final String newId, final String oldUrl);
        void onReplaceMediaFilesEditedBlock(final String mediaFiles, final String blockId);
    }

    interface FeaturedImageEmitter {
        void sendToJSFeaturedImageId(int mediaId);
    }

    interface ReplaceUnsupportedBlockCallback {
        void replaceUnsupportedBlock(String content, String blockId);
    }

    interface FocalPointPickerTooltipShownCallback {
        void onRequestFocalPointPickerTooltipShown(boolean tooltipShown);
    }

    interface BlockTypeImpressionsCallback {
        void onRequestBlockTypeImpressions(ReadableMap impressions);
    }

    // Ref: https://github.com/facebook/react-native/blob/HEAD/Libraries/polyfills/console.js#L376
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
        ANY("any"),
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

    void requestMediaPickFromMediaLibrary(MediaSelectedCallback mediaSelectedCallback, Boolean allowMultipleSelection, MediaType mediaType);

    void requestMediaPickFromDeviceLibrary(MediaSelectedCallback mediaSelectedCallback, Boolean allowMultipleSelection, MediaType mediaType);

    void requestMediaPickerFromDeviceCamera(MediaSelectedCallback mediaSelectedCallback, MediaType mediaType);

    void requestMediaImport(String url, MediaSelectedCallback mediaSelectedCallback);

    void mediaUploadSync(MediaSelectedCallback mediaSelectedCallback);

    void mediaSaveSync(MediaSelectedCallback mediaSelectedCallback);

    void requestImageFailedRetryDialog(int mediaId);

    void requestImageUploadCancelDialog(int mediaId);

    void requestImageUploadCancel(int mediaId);

    void setFeaturedImage(int mediaId);

    void editorDidEmitLog(String message, LogLevel logLevel);

    void editorDidAutosave();

    void getOtherMediaPickerOptions(OtherMediaOptionsReceivedCallback otherMediaOptionsReceivedCallback, MediaType mediaType);

    void requestMediaPickFrom(String mediaSource, MediaSelectedCallback mediaSelectedCallback, Boolean allowMultipleSelection);

    void requestImageFullscreenPreview(String mediaUrl);

    void requestMediaEditor(MediaSelectedCallback mediaSelectedCallback, String mediaUrl);

    void gutenbergDidRequestUnsupportedBlockFallback(ReplaceUnsupportedBlockCallback replaceUnsupportedBlockCallback,
                                                     String content,
                                                     String blockId,
                                                     String blockName,
                                                     String blockTitle);

    void gutenbergDidSendButtonPressedAction(String buttonType);

    void onShowUserSuggestions(Consumer<String> onResult);

    void onShowXpostSuggestions(Consumer<String> onResult);

    void requestMediaFilesEditorLoad(ReadableArray mediaFiles, String blockId);

    void requestMediaFilesFailedRetryDialog(ReadableArray mediaFiles);

    void requestMediaFilesUploadCancelDialog(ReadableArray mediaFiles);

    void requestMediaFilesSaveCancelDialog(ReadableArray mediaFiles);

    void mediaFilesBlockReplaceSync(ReadableArray mediaFiles, String blockId);

    void setFocalPointPickerTooltipShown(boolean tooltipShown);

    void requestFocalPointPickerTooltipShown(FocalPointPickerTooltipShownCallback focalPointPickerTooltipShownCallback);

    void requestPreview();

    void requestBlockTypeImpressions(BlockTypeImpressionsCallback blockTypeImpressionsCallback);

    void setBlockTypeImpressions(ReadableMap impressions);

    void requestContactCustomerSupport();

    void requestGotoCustomerSupportOptions();

    void sendEventToHost(String eventName, ReadableMap properties);
}
