package org.wordpress.mobile.ReactNativeGutenbergBridge;

import android.support.annotation.Nullable;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import org.wordpress.mobile.ReactNativeGutenbergBridge.GutenbergBridgeJS2Parent.MediaSelectedCallback;

public class RNReactNativeGutenbergBridgeModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext mReactContext;
    private final GutenbergBridgeJS2Parent mGutenbergBridgeJS2Parent;

    private static final String EVENT_NAME_REQUEST_GET_HTML = "requestGetHtml";
    private static final String EVENT_NAME_UPDATE_HTML = "updateHtml";
    private static final String EVENT_NAME_UPDATE_TITLE = "setTitle";
    private static final String EVENT_NAME_FOCUS_TITLE = "setFocusOnTitle";
    private static final String EVENT_NAME_MEDIA_UPLOAD = "mediaUpload";
    private static final String EVENT_NAME_MEDIA_APPEND = "mediaAppend";

    private static final String MAP_KEY_UPDATE_HTML = "html";
    private static final String MAP_KEY_UPDATE_TITLE = "title";
    private static final String MAP_KEY_MEDIA_FILE_UPLOAD_STATE = "state";
    private static final String MAP_KEY_MEDIA_FILE_UPLOAD_MEDIA_ID = "mediaId";
    private static final String MAP_KEY_MEDIA_FILE_UPLOAD_MEDIA_URL = "mediaUrl";
    private static final String MAP_KEY_MEDIA_FILE_UPLOAD_MEDIA_PROGRESS = "progress";
    private static final String MAP_KEY_MEDIA_FILE_UPLOAD_MEDIA_SERVER_ID = "mediaServerId";

    private static final int MEDIA_UPLOAD_STATE_UPLOADING = 1;
    private static final int MEDIA_UPLOAD_STATE_SUCCEEDED = 2;
    private static final int MEDIA_UPLOAD_STATE_FAILED = 3;
    private static final int MEDIA_UPLOAD_STATE_RESET = 4;

    private static final int MEDIA_SERVER_ID_UNKNOWN = 0;

    private static final String MEDIA_SOURCE_MEDIA_LIBRARY = "SITE_MEDIA_LIBRARY";
    private static final String MEDIA_SOURCE_DEVICE_LIBRARY = "DEVICE_MEDIA_LIBRARY";
    private static final String MEDIA_SOURCE_DEVICE_CAMERA = "DEVICE_CAMERA";


    public RNReactNativeGutenbergBridgeModule(ReactApplicationContext reactContext,
            GutenbergBridgeJS2Parent gutenbergBridgeJS2Parent) {
        super(reactContext);
        mReactContext = reactContext;
        mGutenbergBridgeJS2Parent = gutenbergBridgeJS2Parent;
    }

    @Override
    public String getName() {
        return "RNReactNativeGutenbergBridge";
    }

    private void emitToJS(String eventName, @Nullable WritableMap data) {
        mReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit(eventName, data);
    }

    public void getHtmlFromJS() {
        emitToJS(EVENT_NAME_REQUEST_GET_HTML, null);
    }

    public void setHtmlInJS(String html) {
        WritableMap writableMap = new WritableNativeMap();
        writableMap.putString(MAP_KEY_UPDATE_HTML, html);
        emitToJS(EVENT_NAME_UPDATE_HTML, writableMap);
    }

    public void setTitleInJS(String title) {
        WritableMap writableMap = new WritableNativeMap();
        writableMap.putString(MAP_KEY_UPDATE_TITLE, title);
        emitToJS(EVENT_NAME_UPDATE_TITLE, writableMap);
    }

    public void setFocusOnTitleInJS() {
        WritableMap writableMap = new WritableNativeMap();
        emitToJS(EVENT_NAME_FOCUS_TITLE, writableMap);
    }

    public void appendNewImageBlock(int mediaId, String mediaUri) {
        WritableMap writableMap = new WritableNativeMap();
        writableMap.putString(MAP_KEY_MEDIA_FILE_UPLOAD_MEDIA_URL, mediaUri);
        writableMap.putInt(MAP_KEY_MEDIA_FILE_UPLOAD_MEDIA_ID, mediaId);
        emitToJS(EVENT_NAME_MEDIA_APPEND, writableMap);
    }

    @ReactMethod
    public void provideToNative_Html(String html, String title, boolean changed) {
        mGutenbergBridgeJS2Parent.responseHtml(title, html, changed);
    }

    @ReactMethod
    public void editorDidMount(boolean hasUnsupportedBlocks) {
        mGutenbergBridgeJS2Parent.editorDidMount(hasUnsupportedBlocks);
    }

    @ReactMethod
    public void requestMediaPickFrom(String mediaSource, final Callback onUploadMediaSelected) {
        if (mediaSource.equals(MEDIA_SOURCE_MEDIA_LIBRARY)) {
            mGutenbergBridgeJS2Parent.requestMediaPickFromMediaLibrary(getNewMediaSelectedCallback(onUploadMediaSelected));
        } else if (mediaSource.equals(MEDIA_SOURCE_DEVICE_LIBRARY)) {
            mGutenbergBridgeJS2Parent.requestMediaPickFromDeviceLibrary(getNewUploadMediaCallback(onUploadMediaSelected));
        } else if (mediaSource.equals(MEDIA_SOURCE_DEVICE_CAMERA)) {
            mGutenbergBridgeJS2Parent.requestMediaPickerFromDeviceCamera(getNewUploadMediaCallback(onUploadMediaSelected));
        }
    }

    @ReactMethod
    public void requestMediaImport(String url, final Callback onUploadMediaSelected) {
        mGutenbergBridgeJS2Parent.requestMediaImport(url, getNewMediaSelectedCallback(onUploadMediaSelected));
    }

    @ReactMethod
    public void mediaUploadSync() {
        mGutenbergBridgeJS2Parent.mediaUploadSync(getNewUploadMediaCallback(null));
    }

    @ReactMethod
    public void requestImageFailedRetryDialog(final int mediaId) {
        mGutenbergBridgeJS2Parent.requestImageFailedRetryDialog(mediaId);
    }

    @ReactMethod
    public void requestImageUploadCancelDialog(final int mediaId) {
        mGutenbergBridgeJS2Parent.requestImageUploadCancelDialog(mediaId);
    }

    @ReactMethod
    public void requestImageUploadCancel(final int mediaId) {
        mGutenbergBridgeJS2Parent.requestImageUploadCancel(mediaId);
    }

    @ReactMethod
    public void editorDidEmitLog(String message, int logLevel) {
        mGutenbergBridgeJS2Parent.editorDidEmitLog(message, GutenbergBridgeJS2Parent.LogLevel.valueOf(logLevel));
    }

    private MediaSelectedCallback getNewMediaSelectedCallback(final Callback jsCallback) {
        return new MediaSelectedCallback() {
            @Override public void onMediaSelected(int mediaId, String mediaUrl) {
                jsCallback.invoke(mediaId, mediaUrl);
            }
        };
    }

    private GutenbergBridgeJS2Parent.MediaUploadCallback getNewUploadMediaCallback(final Callback jsCallback) {
        return new GutenbergBridgeJS2Parent.MediaUploadCallback() {
            @Override
            public void onUploadMediaFileSelected(int mediaId, String mediaUri) {
                if (jsCallback != null) {
                    jsCallback.invoke(mediaId, mediaUri, 0);
                }
            }

            @Override public void onUploadMediaFileClear(int mediaId) {
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
        };
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
        emitToJS(EVENT_NAME_MEDIA_UPLOAD, writableMap);
    }

    public void toggleEditorMode() {
        emitToJS("toggleHTMLMode", null);
    }
}
