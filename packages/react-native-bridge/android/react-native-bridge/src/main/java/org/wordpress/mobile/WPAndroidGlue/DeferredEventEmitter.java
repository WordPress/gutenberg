package org.wordpress.mobile.WPAndroidGlue;

import android.util.Pair;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;

import org.wordpress.mobile.ReactNativeGutenbergBridge.GutenbergBridgeJS2Parent.MediaUploadEventEmitter;
import org.wordpress.mobile.ReactNativeGutenbergBridge.GutenbergBridgeJS2Parent.MediaSaveEventEmitter;

import java.util.Queue;
import java.util.concurrent.ConcurrentLinkedQueue;

import static org.wordpress.mobile.ReactNativeGutenbergBridge.RNReactNativeGutenbergBridgeModule.MAP_KEY_MEDIA_FILE_UPLOAD_MEDIA_ID;
import static org.wordpress.mobile.ReactNativeGutenbergBridge.RNReactNativeGutenbergBridgeModule.MAP_KEY_MEDIA_FILE_UPLOAD_MEDIA_NEW_ID;
import static org.wordpress.mobile.ReactNativeGutenbergBridge.RNReactNativeGutenbergBridgeModule.MAP_KEY_MEDIA_FILE_UPLOAD_MEDIA_URL;
import static org.wordpress.mobile.ReactNativeGutenbergBridge.RNReactNativeGutenbergBridgeModule.MAP_KEY_MEDIA_FINAL_SAVE_RESULT_SUCCESS_VALUE;

public class DeferredEventEmitter implements MediaUploadEventEmitter, MediaSaveEventEmitter {
    public interface JSEventEmitter {
        void emitToJS(String eventName, @Nullable WritableMap data);
    }
    private static final int MEDIA_SERVER_ID_UNKNOWN = 0;
    private static final int MEDIA_UPLOAD_STATE_UPLOADING = 1;
    private static final int MEDIA_UPLOAD_STATE_SUCCEEDED = 2;
    private static final int MEDIA_UPLOAD_STATE_FAILED = 3;
    private static final int MEDIA_UPLOAD_STATE_RESET = 4;

    private static final int MEDIA_SAVE_STATE_SAVING = 5;
    private static final int MEDIA_SAVE_STATE_SUCCEEDED = 6;
    private static final int MEDIA_SAVE_STATE_FAILED = 7;
    private static final int MEDIA_SAVE_STATE_RESET = 8;
    private static final int MEDIA_SAVE_FINAL_STATE_RESULT = 9;
    private static final int MEDIA_SAVE_MEDIAID_CHANGED = 10;

    private static final String EVENT_NAME_MEDIA_UPLOAD = "mediaUpload";
    private static final String EVENT_NAME_MEDIA_SAVE = "mediaSave";
    private static final String EVENT_NAME_MEDIA_REPLACE_BLOCK = "replaceBlock";

    private static final String MAP_KEY_MEDIA_FILE_STATE = "state";
    private static final String MAP_KEY_MEDIA_FILE_MEDIA_ACTION_PROGRESS = "progress";
    private static final String MAP_KEY_MEDIA_FILE_MEDIA_SERVER_ID = "mediaServerId";
    private static final String MAP_KEY_UPDATE_CAPABILITIES = "updateCapabilities";

    private static final String MAP_KEY_REPLACE_BLOCK_HTML = "html";
    private static final String MAP_KEY_REPLACE_BLOCK_BLOCK_ID = "clientId";

    /**
     * Used for storing deferred actions prior to editor mounting
     */
    private Queue<Pair<String, WritableMap>> mPendingActions = new ConcurrentLinkedQueue<>();

    private JSEventEmitter mJSEventEmitter;

    void setEmitter(JSEventEmitter emitter) {
        mJSEventEmitter = emitter;
        flushActionQueueToJS();
    }

    /** This will queue actions to JS when the editor has not yet mounted. When the editor mounts, the events will be
     *  flushed. If the editor has already mounted, this will directly call emitToJS. This is useful for critical
     *  messages that have required actions, such as upload completion events.
     *
     * @param eventName the name of the JS event
     * @param data the JS event data (can be null)
     */
    private void queueActionToJS(String eventName, @Nullable WritableMap data) {
        if (mJSEventEmitter == null) {
            mPendingActions.add(new Pair<>(eventName, data));
        } else {
            mJSEventEmitter.emitToJS(eventName, data);
        }
    }

    /** This will optimistically emit events to JS (i.e. when the editor has mounted). If the editor has not mounted,
     *  this will silently drop the message. This is useful to send non-critical messages in a safe way.
     *
     * @param eventName the name of the JS event
     * @param data the JS event data (can be null)
     */
    private void emitOrDrop(String eventName, @Nullable WritableMap data) {
        if (mJSEventEmitter != null) {
            mJSEventEmitter.emitToJS(eventName, data);
        }
    }

    private void flushActionQueueToJS() {
        while (0 < mPendingActions.size()) {
            final Pair<String, WritableMap> action = mPendingActions.remove();
            mJSEventEmitter.emitToJS(action.first, action.second);
        }
    }

    private void setMediaFileUploadDataInJS(int state, int mediaId, String mediaUrl, float progress) {
        setMediaFileUploadDataInJS(state, mediaId, mediaUrl, progress, MEDIA_SERVER_ID_UNKNOWN);
    }

    private void setMediaFileUploadDataInJS(int state, int mediaId, String mediaUrl, float progress, int mediaServerId) {
        WritableMap writableMap = new WritableNativeMap();
        writableMap.putInt(MAP_KEY_MEDIA_FILE_STATE, state);
        writableMap.putInt(MAP_KEY_MEDIA_FILE_UPLOAD_MEDIA_ID, mediaId);
        writableMap.putString(MAP_KEY_MEDIA_FILE_UPLOAD_MEDIA_URL, mediaUrl);
        writableMap.putDouble(MAP_KEY_MEDIA_FILE_MEDIA_ACTION_PROGRESS, progress);
        if (mediaServerId != MEDIA_SERVER_ID_UNKNOWN) {
            writableMap.putInt(MAP_KEY_MEDIA_FILE_MEDIA_SERVER_ID, mediaServerId);
        }
        if (isCriticalMessage(state)) {
            queueActionToJS(EVENT_NAME_MEDIA_UPLOAD, writableMap);
        } else {
            emitOrDrop(EVENT_NAME_MEDIA_UPLOAD, writableMap);
        }
    }

    private void setMediaSaveResultDataInJS(int state, String mediaId, String mediaUrl, float progress) {
        WritableMap writableMap = new WritableNativeMap();
        writableMap.putInt(MAP_KEY_MEDIA_FILE_STATE, state);
        writableMap.putString(MAP_KEY_MEDIA_FILE_UPLOAD_MEDIA_ID, mediaId);
        writableMap.putString(MAP_KEY_MEDIA_FILE_UPLOAD_MEDIA_URL, mediaUrl);
        writableMap.putDouble(MAP_KEY_MEDIA_FILE_MEDIA_ACTION_PROGRESS, progress);
        if (isCriticalMessage(state)) {
            queueActionToJS(EVENT_NAME_MEDIA_SAVE, writableMap);
        } else {
            emitOrDrop(EVENT_NAME_MEDIA_SAVE, writableMap);
        }
    }

    private void setMediaSaveResultDataInJS(int state, String mediaId, boolean success, float progress) {
        WritableMap writableMap = new WritableNativeMap();
        writableMap.putInt(MAP_KEY_MEDIA_FILE_STATE, state);
        writableMap.putString(MAP_KEY_MEDIA_FILE_UPLOAD_MEDIA_ID, mediaId);
        writableMap.putBoolean(MAP_KEY_MEDIA_FINAL_SAVE_RESULT_SUCCESS_VALUE, success);
        writableMap.putDouble(MAP_KEY_MEDIA_FILE_MEDIA_ACTION_PROGRESS, progress);
        if (isCriticalMessage(state)) {
            queueActionToJS(EVENT_NAME_MEDIA_SAVE, writableMap);
        } else {
            emitOrDrop(EVENT_NAME_MEDIA_SAVE, writableMap);
        }
    }

    private boolean isCriticalMessage(int state) {
        return state == MEDIA_UPLOAD_STATE_SUCCEEDED || state == MEDIA_UPLOAD_STATE_FAILED
               || state == MEDIA_SAVE_STATE_SUCCEEDED || state == MEDIA_SAVE_STATE_FAILED
               || state == MEDIA_SAVE_MEDIAID_CHANGED;
    }

    @Override
    public void onUploadMediaFileClear(int mediaId) {
        setMediaFileUploadDataInJS(MEDIA_UPLOAD_STATE_RESET, mediaId, null, 0);
    }

    @Override
    public void onMediaFileUploadProgress(int mediaId, float progress) {
        setMediaFileUploadDataInJS(MEDIA_UPLOAD_STATE_UPLOADING, mediaId, null, progress);
    }

    @Override
    public void onMediaFileUploadSucceeded(int mediaId, String mediaUrl, int mediaServerId) {
        setMediaFileUploadDataInJS(MEDIA_UPLOAD_STATE_SUCCEEDED, mediaId, mediaUrl, 1, mediaServerId);
    }

    @Override
    public void onMediaFileUploadFailed(int mediaId) {
        setMediaFileUploadDataInJS(MEDIA_UPLOAD_STATE_FAILED, mediaId, null, 0);
    }

    // Media file save events emitter
    @Override
    public void onSaveMediaFileClear(String mediaId) {
        setMediaSaveResultDataInJS(MEDIA_SAVE_STATE_RESET, mediaId, null, 0);
    }

    @Override
    public void onMediaFileSaveProgress(String mediaId, float progress) {
        setMediaSaveResultDataInJS(MEDIA_SAVE_STATE_SAVING, mediaId, null, progress);
    }

    @Override
    public void onMediaFileSaveSucceeded(String mediaId, String mediaUrl) {
        setMediaSaveResultDataInJS(MEDIA_SAVE_STATE_SUCCEEDED, mediaId, mediaUrl, 1);
    }

    @Override
    public void onMediaFileSaveFailed(String mediaId) {
        setMediaSaveResultDataInJS(MEDIA_SAVE_STATE_FAILED, mediaId, null, 0);
    }

    @Override
    public void onMediaCollectionSaveResult(String firstMediaIdInCollection, boolean success) {
        setMediaSaveResultDataInJS(MEDIA_SAVE_FINAL_STATE_RESULT, firstMediaIdInCollection, success, success ? 1 : 0);
    }

    @Override public void onMediaIdChanged(String oldId, String newId, String oldUrl) {
        WritableMap writableMap = new WritableNativeMap();
        writableMap.putInt(MAP_KEY_MEDIA_FILE_STATE, MEDIA_SAVE_MEDIAID_CHANGED);
        writableMap.putString(MAP_KEY_MEDIA_FILE_UPLOAD_MEDIA_ID, oldId);
        writableMap.putString(MAP_KEY_MEDIA_FILE_UPLOAD_MEDIA_NEW_ID, newId);
        writableMap.putString(MAP_KEY_MEDIA_FILE_UPLOAD_MEDIA_URL, oldUrl);
        if (isCriticalMessage(MEDIA_SAVE_MEDIAID_CHANGED)) {
            queueActionToJS(EVENT_NAME_MEDIA_SAVE, writableMap);
        } else {
            emitOrDrop(EVENT_NAME_MEDIA_SAVE, writableMap);
        }
    }

    @Override public void onReplaceMediaFilesEditedBlock(String mediaFiles, String blockId) {
        WritableMap writableMap = new WritableNativeMap();
        writableMap.putString(MAP_KEY_REPLACE_BLOCK_HTML, mediaFiles);
        writableMap.putString(MAP_KEY_REPLACE_BLOCK_BLOCK_ID, blockId);
        // this is a critical message so, always enqueue
        queueActionToJS(EVENT_NAME_MEDIA_REPLACE_BLOCK, writableMap);
    }

    public void updateCapabilities(GutenbergProps gutenbergProps) {
        queueActionToJS(MAP_KEY_UPDATE_CAPABILITIES, Arguments.makeNativeMap(gutenbergProps.getUpdatedCapabilitiesProps()));
    }
}
