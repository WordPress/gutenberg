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
    private static final String EVENT_NAME_MEDIA_UPLOAD = "mediaUpload";

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

    private static final int MEDIA_SERVER_ID_UNKNOWN = 0;


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

    @ReactMethod
    public void provideToNative_Html(String html, String title, boolean changed) {
        mGutenbergBridgeJS2Parent.responseHtml(title, html, changed);
    }

    @ReactMethod
    public void onMediaLibraryPressed(final Callback onMediaSelected) {
        mGutenbergBridgeJS2Parent.onMediaLibraryPressed(new MediaSelectedCallback() {
            @Override public void onMediaSelected(String mediaUrl) {
                onMediaSelected.invoke(mediaUrl);
            }
        });
    }

    @ReactMethod
    public void onImageQueryReattach() {
        mGutenbergBridgeJS2Parent.onImageQueryReattach(getNewUploadMediaCallback(null));
    }

    @ReactMethod
    public void onUploadMediaPressed(final Callback onUploadMediaSelected) {
        mGutenbergBridgeJS2Parent.onUploadMediaPressed(getNewUploadMediaCallback(onUploadMediaSelected));
    }

    @ReactMethod
    public void onCapturePhotoPressed(final Callback onPhotoCaptured) {
        mGutenbergBridgeJS2Parent.onCapturePhotoPressed(getNewUploadMediaCallback(onPhotoCaptured));
    }

    private GutenbergBridgeJS2Parent.MediaUploadCallback getNewUploadMediaCallback(final Callback jsCallback) {
        return new GutenbergBridgeJS2Parent.MediaUploadCallback() {
            @Override
            public void onUploadMediaFileSelected(int mediaId, String mediaUri) {
                if (jsCallback != null) {
                    jsCallback.invoke(mediaId, mediaUri, 0);
                }
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
