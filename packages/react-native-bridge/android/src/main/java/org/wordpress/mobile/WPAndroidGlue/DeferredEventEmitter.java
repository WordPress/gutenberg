package org.wordpress.mobile.WPAndroidGlue;

import android.util.Pair;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;

import org.wordpress.mobile.ReactNativeGutenbergBridge.GutenbergBridgeJS2Parent.MediaUploadEventEmitter;

import java.util.Queue;
import java.util.concurrent.ConcurrentLinkedQueue;

import static org.wordpress.mobile.ReactNativeGutenbergBridge.RNReactNativeGutenbergBridgeModule.MAP_KEY_MEDIA_FILE_UPLOAD_MEDIA_ID;
import static org.wordpress.mobile.ReactNativeGutenbergBridge.RNReactNativeGutenbergBridgeModule.MAP_KEY_MEDIA_FILE_UPLOAD_MEDIA_URL;

public class DeferredEventEmitter implements MediaUploadEventEmitter {
    public interface JSEventEmitter {
        void emitToJS(String eventName, @Nullable WritableMap data);
    }
    private static final int MEDIA_SERVER_ID_UNKNOWN = 0;
    private static final int MEDIA_UPLOAD_STATE_UPLOADING = 1;
    private static final int MEDIA_UPLOAD_STATE_SUCCEEDED = 2;
    private static final int MEDIA_UPLOAD_STATE_FAILED = 3;
    private static final int MEDIA_UPLOAD_STATE_RESET = 4;

    private static final String EVENT_NAME_MEDIA_UPLOAD = "mediaUpload";

    private static final String MAP_KEY_MEDIA_FILE_UPLOAD_STATE = "state";
    private static final String MAP_KEY_MEDIA_FILE_UPLOAD_MEDIA_PROGRESS = "progress";
    private static final String MAP_KEY_MEDIA_FILE_UPLOAD_MEDIA_SERVER_ID = "mediaServerId";


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
        writableMap.putInt(MAP_KEY_MEDIA_FILE_UPLOAD_STATE, state);
        writableMap.putInt(MAP_KEY_MEDIA_FILE_UPLOAD_MEDIA_ID, mediaId);
        writableMap.putString(MAP_KEY_MEDIA_FILE_UPLOAD_MEDIA_URL, mediaUrl);
        writableMap.putDouble(MAP_KEY_MEDIA_FILE_UPLOAD_MEDIA_PROGRESS, progress);
        if (mediaServerId != MEDIA_SERVER_ID_UNKNOWN) {
            writableMap.putInt(MAP_KEY_MEDIA_FILE_UPLOAD_MEDIA_SERVER_ID, mediaServerId);
        }
        if (isCriticalMessage(state)) {
            queueActionToJS(EVENT_NAME_MEDIA_UPLOAD, writableMap);
        } else {
            emitOrDrop(EVENT_NAME_MEDIA_UPLOAD, writableMap);
        }
    }

    private boolean isCriticalMessage(int state) {
        return state == MEDIA_UPLOAD_STATE_SUCCEEDED || state == MEDIA_UPLOAD_STATE_FAILED;
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
}
