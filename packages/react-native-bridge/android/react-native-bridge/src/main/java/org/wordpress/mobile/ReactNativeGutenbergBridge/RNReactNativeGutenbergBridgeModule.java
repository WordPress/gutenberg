package org.wordpress.mobile.ReactNativeGutenbergBridge;

import android.app.Activity;
import android.content.Context;
import android.os.Build;
import android.os.Bundle;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.provider.Settings;
import android.view.View;
import android.view.ViewTreeObserver;
import android.view.inputmethod.InputMethodManager;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import org.wordpress.mobile.ReactNativeGutenbergBridge.GutenbergBridgeJS2Parent.ConnectionStatusCallback;
import org.wordpress.mobile.ReactNativeGutenbergBridge.GutenbergBridgeJS2Parent.LogExceptionCallback;
import org.wordpress.mobile.ReactNativeGutenbergBridge.GutenbergBridgeJS2Parent.MediaType;
import org.wordpress.mobile.ReactNativeGutenbergBridge.GutenbergBridgeJS2Parent.OtherMediaOptionsReceivedCallback;
import org.wordpress.mobile.ReactNativeGutenbergBridge.GutenbergBridgeJS2Parent.FocalPointPickerTooltipShownCallback;
import org.wordpress.mobile.ReactNativeGutenbergBridge.GutenbergBridgeJS2Parent.BlockTypeImpressionsCallback;
import org.wordpress.mobile.WPAndroidGlue.DeferredEventEmitter;
import org.wordpress.mobile.WPAndroidGlue.GutenbergJsException;
import org.wordpress.mobile.WPAndroidGlue.MediaOption;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class RNReactNativeGutenbergBridgeModule extends ReactContextBaseJavaModule implements
        DeferredEventEmitter.JSEventEmitter {
    private final ReactApplicationContext mReactContext;
    private final GutenbergBridgeJS2Parent mGutenbergBridgeJS2Parent;
    private Runnable mKeyboardRunnable;

    private static final String EVENT_NAME_REQUEST_GET_HTML = "requestGetHtml";
    private static final String EVENT_NAME_UPDATE_HTML = "updateHtml";
    private static final String EVENT_NAME_UPDATE_TITLE = "setTitle";
    private static final String EVENT_NAME_FOCUS_TITLE = "setFocusOnTitle";
    private static final String EVENT_NAME_MEDIA_APPEND = "mediaAppend";
    private static final String EVENT_NAME_TOGGLE_HTML_MODE = "toggleHTMLMode";
    private static final String EVENT_NAME_POST_SAVE_EVENT = "postHasBeenJustSaved";
    private static final String EVENT_NAME_NOTIFY_MODAL_CLOSED = "notifyModalClosed";
    private static final String EVENT_NAME_PREFERRED_COLOR_SCHEME = "preferredColorScheme";
    private static final String EVENT_NAME_MEDIA_REPLACE_BLOCK = "replaceBlock";
    private static final String EVENT_NAME_UPDATE_EDITOR_SETTINGS = "updateEditorSettings";
    private static final String EVENT_NAME_SHOW_NOTICE = "showNotice";
    private static final String EVENT_NAME_SHOW_EDITOR_HELP = "showEditorHelp";

    private static final String EVENT_NAME_ON_UNDO_PRESSED = "onUndoPressed";

    private static final String EVENT_NAME_ON_REDO_PRESSED = "onRedoPressed";
    private static final String EVENT_NAME_ON_CONTENT_UPDATE = "onContentUpdate";

    private static final String MAP_KEY_UPDATE_HTML = "html";
    private static final String MAP_KEY_UPDATE_TITLE = "title";
    public static final String MAP_KEY_MEDIA_FILE_UPLOAD_MEDIA_NEW_ID = "newId";
    private static final String MAP_KEY_SHOW_NOTICE_MESSAGE = "message";

    public static final String MAP_KEY_MEDIA_FILE_UPLOAD_MEDIA_ID = "mediaId";
    public static final String MAP_KEY_MEDIA_FILE_UPLOAD_MEDIA_URL = "mediaUrl";
    public static final String MAP_KEY_MEDIA_FILE_UPLOAD_MEDIA_TYPE = "mediaType";
    private static final String MAP_KEY_THEME_UPDATE_COLORS = "colors";
    private static final String MAP_KEY_THEME_UPDATE_GRADIENTS = "gradients";
    private static final String MAP_KEY_THEME_UPDATE_RAW_STYLES = "rawStyles";
    private static final String MAP_KEY_THEME_UPDATE_RAW_FEATURES = "rawFeatures";
    public static final String MAP_KEY_MEDIA_FINAL_SAVE_RESULT_SUCCESS_VALUE = "success";

    private static final String MAP_KEY_IS_PREFERRED_COLOR_SCHEME_DARK = "isPreferredColorSchemeDark";

    private static final String MEDIA_SOURCE_MEDIA_LIBRARY = "SITE_MEDIA_LIBRARY";
    private static final String MEDIA_SOURCE_DEVICE_LIBRARY = "DEVICE_MEDIA_LIBRARY";
    private static final String MEDIA_SOURCE_DEVICE_CAMERA = "DEVICE_CAMERA";

    private static final String MAP_KEY_REPLACE_BLOCK_HTML = "html";
    private static final String MAP_KEY_REPLACE_BLOCK_BLOCK_ID = "clientId";

    private static final String MAP_KEY_UPDATE_CONTENT = "content";
    public static final String MAP_KEY_FEATURED_IMAGE_ID = "featuredImageId";

    public static final String MAP_KEY_IS_CONNECTED = "isConnected";

    private boolean mIsDarkMode;

    public RNReactNativeGutenbergBridgeModule(ReactApplicationContext reactContext,
            GutenbergBridgeJS2Parent gutenbergBridgeJS2Parent, boolean isDarkMode) {
        super(reactContext);
        mIsDarkMode = isDarkMode;
        mReactContext = reactContext;
        mGutenbergBridgeJS2Parent = gutenbergBridgeJS2Parent;
    }

    @Override
    public String getName() {
        return "RNReactNativeGutenbergBridge";
    }

    @Override
    public Map<String, Object> getConstants() {
        final HashMap<String, Object> constants = new HashMap<>();
        constants.put("isInitialColorSchemeDark", mIsDarkMode);
        return constants;
    }

    @Override
    public void emitToJS(String eventName, @Nullable WritableMap data) {
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

    public void showNoticeInJS(String message) {
        WritableMap writableMap = new WritableNativeMap();
        writableMap.putString(MAP_KEY_SHOW_NOTICE_MESSAGE, message);
        emitToJS(EVENT_NAME_SHOW_NOTICE, writableMap);
    }

    public void appendNewMediaBlock(int mediaId, String mediaUri, String mediaType) {
        WritableMap writableMap = new WritableNativeMap();
        writableMap.putString(MAP_KEY_MEDIA_FILE_UPLOAD_MEDIA_TYPE, mediaType);
        writableMap.putString(MAP_KEY_MEDIA_FILE_UPLOAD_MEDIA_URL, mediaUri);
        writableMap.putInt(MAP_KEY_MEDIA_FILE_UPLOAD_MEDIA_ID, mediaId);
        emitToJS(EVENT_NAME_MEDIA_APPEND, writableMap);
    }

    public void setPreferredColorScheme(boolean isDarkMode) {
        WritableMap writableMap = new WritableNativeMap();
        writableMap.putBoolean(MAP_KEY_IS_PREFERRED_COLOR_SCHEME_DARK, isDarkMode);
        emitToJS(EVENT_NAME_PREFERRED_COLOR_SCHEME, writableMap);
    }

    public void updateTheme(@Nullable Bundle editorTheme) {
        if (editorTheme == null) return;

        WritableMap writableMap = new WritableNativeMap();
        Serializable colors = editorTheme.getSerializable(MAP_KEY_THEME_UPDATE_COLORS);
        Serializable gradients = editorTheme.getSerializable(MAP_KEY_THEME_UPDATE_GRADIENTS);
        Serializable rawStyles = editorTheme.getSerializable(MAP_KEY_THEME_UPDATE_RAW_STYLES);
        Serializable rawFeatures = editorTheme.getSerializable(MAP_KEY_THEME_UPDATE_RAW_FEATURES);

        if (colors != null) {
            writableMap.putArray(MAP_KEY_THEME_UPDATE_COLORS, Arguments.fromList((ArrayList)colors));
        }

        if (gradients != null) {
            writableMap.putArray(MAP_KEY_THEME_UPDATE_GRADIENTS, Arguments.fromList((ArrayList)gradients));
        }

        if (rawStyles != null) {
            writableMap.putString(MAP_KEY_THEME_UPDATE_RAW_STYLES, rawStyles.toString());
        }

        if (rawFeatures != null) {
            writableMap.putString(MAP_KEY_THEME_UPDATE_RAW_FEATURES, rawFeatures.toString());
        }

        emitToJS(EVENT_NAME_UPDATE_EDITOR_SETTINGS, writableMap);
    }

    public void showEditorHelp() {
        emitToJS(EVENT_NAME_SHOW_EDITOR_HELP, null);
    }

    public void onUndoPressed() {
        emitToJS(EVENT_NAME_ON_UNDO_PRESSED, null);
    }

    public void onRedoPressed() {
        emitToJS(EVENT_NAME_ON_REDO_PRESSED, null);
    }

    public void onContentUpdate(String content) {
        WritableMap writableMap = new WritableNativeMap();

        writableMap.putString(MAP_KEY_UPDATE_CONTENT, content);
        emitToJS(EVENT_NAME_ON_CONTENT_UPDATE, writableMap);
    }

    @ReactMethod
    public void addListener(String eventName) {
        // Keep: Required for RN built in Event Emitter Calls.
    }

    @ReactMethod
    public void removeListeners(Integer count) {
        // Keep: Required for RN built in Event Emitter Calls.
    }

    @ReactMethod
    public void provideToNative_Html(String html, String title, boolean changed, ReadableMap contentInfo) {
        mGutenbergBridgeJS2Parent.responseHtml(title, html, changed, contentInfo);
    }

    @ReactMethod
    public void editorDidMount(ReadableArray unsupportedBlockNames) {
        mGutenbergBridgeJS2Parent.editorDidMount(unsupportedBlockNames);
    }

    @ReactMethod
    public void requestMediaPickFrom(String mediaSource, ReadableArray filter, Boolean allowMultipleSelection, final Callback onMediaSelected) {
        MediaType mediaType = getMediaTypeFromFilter(filter);
        if (mediaSource.equals(MEDIA_SOURCE_MEDIA_LIBRARY)) {
            mGutenbergBridgeJS2Parent.requestMediaPickFromMediaLibrary(getNewMediaSelectedCallback(allowMultipleSelection, onMediaSelected), allowMultipleSelection, mediaType);
        } else if (mediaSource.equals(MEDIA_SOURCE_DEVICE_LIBRARY)) {
            mGutenbergBridgeJS2Parent.requestMediaPickFromDeviceLibrary(getNewMediaSelectedCallback(allowMultipleSelection, onMediaSelected), allowMultipleSelection, mediaType);
        } else if (mediaSource.equals(MEDIA_SOURCE_DEVICE_CAMERA)) {
            mGutenbergBridgeJS2Parent.requestMediaPickerFromDeviceCamera(getNewMediaSelectedCallback(allowMultipleSelection, onMediaSelected), mediaType);
        } else {
            mGutenbergBridgeJS2Parent.requestMediaPickFrom(mediaSource, getNewMediaSelectedCallback(allowMultipleSelection, onMediaSelected), allowMultipleSelection);
        }
    }

    private MediaType getMediaTypeFromFilter(ReadableArray filter) {
        switch (filter.size()) {
            case 1:
                return MediaType.getEnum(filter.getString(0));
            case 2:
                MediaType filter0 = MediaType.getEnum(filter.getString(0));
                MediaType filter1 = MediaType.getEnum(filter.getString(1));

                if ((filter0.equals(MediaType.VIDEO) && filter1.equals(MediaType.IMAGE))
                    || (filter0.equals(MediaType.IMAGE) && filter1.equals(MediaType.VIDEO))) {
                    return MediaType.MEDIA;
                }
            default:
                return MediaType.OTHER;
        }
    }

    @ReactMethod
    public void requestMediaImport(String url, final Callback onUploadMediaSelected) {
        mGutenbergBridgeJS2Parent.requestMediaImport(url, getNewMediaSelectedCallback(false, onUploadMediaSelected));
    }

    @ReactMethod
    public void mediaUploadSync() {
        mGutenbergBridgeJS2Parent.mediaUploadSync(getNewMediaSelectedCallback(false,null));
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
    public void setFeaturedImage(final int mediaId) {
        mGutenbergBridgeJS2Parent.setFeaturedImage(mediaId);
    }

    @ReactMethod
    public void requestImageFullscreenPreview(String mediaUrl) {
        mGutenbergBridgeJS2Parent.requestImageFullscreenPreview(mediaUrl);
    }

    @ReactMethod
    public void requestMediaEditor(String mediaUrl, final Callback onUploadMediaSelected) {
        mGutenbergBridgeJS2Parent.requestMediaEditor(getNewMediaSelectedCallback(false, onUploadMediaSelected), mediaUrl);
    }

    @ReactMethod
    public void editorDidEmitLog(String message, int logLevel) {
        mGutenbergBridgeJS2Parent.editorDidEmitLog(message, GutenbergBridgeJS2Parent.LogLevel.valueOf(logLevel));
    }

    @ReactMethod
    public void editorDidAutosave() {
        mGutenbergBridgeJS2Parent.editorDidAutosave();
    }

    @ReactMethod
    public void getOtherMediaOptions(ReadableArray filter, final Callback jsCallback) {
        OtherMediaOptionsReceivedCallback otherMediaOptionsReceivedCallback = getNewOtherMediaReceivedCallback(jsCallback);
        MediaType mediaType = getMediaTypeFromFilter(filter);
        mGutenbergBridgeJS2Parent.getOtherMediaPickerOptions(otherMediaOptionsReceivedCallback, mediaType);
    }

    @ReactMethod
    public void fetchRequest(String path, boolean enableCaching, Promise promise) {
        mGutenbergBridgeJS2Parent.performGetRequest(path,
                enableCaching,
                promise::resolve,
                errorBundle -> {
                    WritableMap writableMap = Arguments.makeNativeMap(errorBundle);
                    if (writableMap.hasKey("code")) {
                        String code = String.valueOf(writableMap.getInt("code"));
                        promise.reject(code, new Error(), writableMap);
                    } else {
                        promise.reject(new Error(), writableMap);
                    }
                });
    }

    @ReactMethod
    public void postRequest(String path, ReadableMap data, Promise promise) {
        mGutenbergBridgeJS2Parent.performPostRequest(path, data,
                promise::resolve,
                errorBundle -> {
                    WritableMap writableMap = Arguments.makeNativeMap(errorBundle);
                    if (writableMap.hasKey("code")) {
                        String code = String.valueOf(writableMap.getInt("code"));
                        promise.reject(code, new Error(), writableMap);
                    } else {
                        promise.reject(new Error(), writableMap);
                    }
                });
    }

    @ReactMethod
    public void requestUnsupportedBlockFallback(String content, String blockId, String blockName, String blockTitle) {
        mGutenbergBridgeJS2Parent.gutenbergDidRequestUnsupportedBlockFallback((savedContent, savedBlockId) ->
                replaceBlock(savedContent, savedBlockId), content, blockId, blockName, blockTitle);
    }

    @ReactMethod
    public void requestEmbedFullscreenPreview(String content, String title) {
        mGutenbergBridgeJS2Parent.requestEmbedFullscreenPreview(content,title);
    }

    @ReactMethod
    public void actionButtonPressed(String buttonType) {
        mGutenbergBridgeJS2Parent.gutenbergDidSendButtonPressedAction(buttonType);
    }

    private void replaceBlock(String content, String blockId) {
        WritableMap writableMap = new WritableNativeMap();
        writableMap.putString(MAP_KEY_REPLACE_BLOCK_HTML, content);
        writableMap.putString(MAP_KEY_REPLACE_BLOCK_BLOCK_ID, blockId);
        emitToJS(EVENT_NAME_MEDIA_REPLACE_BLOCK, writableMap);
    }

    private OtherMediaOptionsReceivedCallback getNewOtherMediaReceivedCallback(final Callback jsCallback) {
        return mediaOptions -> {
            WritableArray writableArray = new WritableNativeArray();
            for (MediaOption mediaOption : mediaOptions) {
                writableArray.pushMap(mediaOption.toMap());
            }
            jsCallback.invoke(writableArray);
        };
    }

    @ReactMethod
    public void showUserSuggestions(Promise promise) {
        mGutenbergBridgeJS2Parent.onShowUserSuggestions(promise::resolve);
    }

    @ReactMethod
    public void showXpostSuggestions(Promise promise) {
        mGutenbergBridgeJS2Parent.onShowXpostSuggestions(promise::resolve);
    }

    @ReactMethod
    public void setFocalPointPickerTooltipShown(boolean tooltipShown) {
        mGutenbergBridgeJS2Parent.setFocalPointPickerTooltipShown(tooltipShown);
    }

    @ReactMethod
    public void requestFocalPointPickerTooltipShown(final Callback jsCallback) {
        FocalPointPickerTooltipShownCallback focalPointPickerTooltipShownCallback = requestFocalPointPickerTooltipShownCallback(jsCallback);
        mGutenbergBridgeJS2Parent.requestFocalPointPickerTooltipShown(focalPointPickerTooltipShownCallback);
    }

    private FocalPointPickerTooltipShownCallback requestFocalPointPickerTooltipShownCallback(final Callback jsCallback) {
        return new FocalPointPickerTooltipShownCallback() {
            @Override public void onRequestFocalPointPickerTooltipShown(boolean tooltipShown) {
                jsCallback.invoke(tooltipShown);
            }
        };
    }

    @ReactMethod
    public void requestPreview() {
        mGutenbergBridgeJS2Parent.requestPreview();
    }

    private GutenbergBridgeJS2Parent.MediaSelectedCallback getNewMediaSelectedCallback(final Boolean allowMultipleSelection, final Callback jsCallback) {
        return new GutenbergBridgeJS2Parent.MediaSelectedCallback() {
            @Override
            public void onMediaFileSelected(List<RNMedia> mediaList) {
                if (allowMultipleSelection) {
                    WritableArray writableArray = new WritableNativeArray();
                    for (RNMedia media : mediaList) {
                        writableArray.pushMap(media.toMap());
                    }
                    jsCallback.invoke(writableArray);
                } else if (!mediaList.isEmpty()) {
                    jsCallback.invoke(mediaList.get(0).toMap());
                } else {
                    // if we have no media (e.g. when a content provider throws an exception during file copy), invoke
                    // the js callback with no arguments
                    jsCallback.invoke();
                }
            }

        };
    }


    public void toggleEditorMode() {
        emitToJS(EVENT_NAME_TOGGLE_HTML_MODE, null);
    }

    public void sendToJSPostSaveEvent() {
        emitToJS(EVENT_NAME_POST_SAVE_EVENT, null);
    }

    public void notifyModalClosed() {
        emitToJS(EVENT_NAME_NOTIFY_MODAL_CLOSED, null);
    }

    @ReactMethod
    public void requestBlockTypeImpressions(final Callback jsCallback) {
        BlockTypeImpressionsCallback blockTypeImpressionsCallback = requestBlockTypeImpressionsCallback(jsCallback);
        mGutenbergBridgeJS2Parent.requestBlockTypeImpressions(blockTypeImpressionsCallback);
    }

    private BlockTypeImpressionsCallback requestBlockTypeImpressionsCallback(final Callback jsCallback) {
        return new GutenbergBridgeJS2Parent.BlockTypeImpressionsCallback() {
            @Override public void onRequestBlockTypeImpressions(ReadableMap impressions) {
                jsCallback.invoke(impressions);
            }
        };
    }

    @ReactMethod
    public void setBlockTypeImpressions(final ReadableMap impressions) {
        mGutenbergBridgeJS2Parent.setBlockTypeImpressions(impressions);
    }

    @ReactMethod
    public void requestContactCustomerSupport() {
        mGutenbergBridgeJS2Parent.requestContactCustomerSupport();
    }

    @ReactMethod
    public void requestGotoCustomerSupportOptions() {
        mGutenbergBridgeJS2Parent.requestGotoCustomerSupportOptions();
    }

    @ReactMethod
    public void sendEventToHost(final String eventName, final ReadableMap properties) {
        mGutenbergBridgeJS2Parent.sendEventToHost(eventName, properties);
    }

    @ReactMethod
    public void toggleUndoButton(final boolean isDisabled) {
        mGutenbergBridgeJS2Parent.toggleUndoButton(isDisabled);
    }

    @ReactMethod
    public void toggleRedoButton(final boolean isDisabled) {
        mGutenbergBridgeJS2Parent.toggleRedoButton(isDisabled);
    }

    @ReactMethod
    public void generateHapticFeedback() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            int hapticFeedbackEnabled = Settings.System.getInt(mReactContext.getContentResolver(), Settings.System.HAPTIC_FEEDBACK_ENABLED, 0);
            if (hapticFeedbackEnabled == 0) {
                return;
            }
            VibrationEffect tickEffect = VibrationEffect.createPredefined(VibrationEffect.EFFECT_TICK);
            Vibrator vibrator = (Vibrator) mReactContext.getSystemService(Context.VIBRATOR_SERVICE);
            if (vibrator != null) {
                vibrator.vibrate(tickEffect);
            }
        }
    }

    @ReactMethod
    public void requestConnectionStatus(final Callback jsCallback) {
        ConnectionStatusCallback connectionStatusCallback = requestConnectionStatusCallback(jsCallback);
        mGutenbergBridgeJS2Parent.requestConnectionStatus(connectionStatusCallback);
    }

    private ConnectionStatusCallback requestConnectionStatusCallback(final Callback jsCallback) {
        return new GutenbergBridgeJS2Parent.ConnectionStatusCallback() {
            @Override public void onRequestConnectionStatus(boolean isConnected) {
                jsCallback.invoke(isConnected);
            }
        };
    }

    @ReactMethod
    public void showAndroidSoftKeyboard() {
        Activity currentActivity = mReactContext.getCurrentActivity();
        if (isAnyViewFocused()) {
            // Cancel any previously scheduled Runnable
            if (mKeyboardRunnable != null) {
                currentActivity.getWindow().getDecorView().removeCallbacks(mKeyboardRunnable);
            }

            View currentFocusedView = getCurrentFocusedView();
            currentFocusedView.getViewTreeObserver().addOnWindowFocusChangeListener(new ViewTreeObserver.OnWindowFocusChangeListener() {
                @Override
                public void onWindowFocusChanged(boolean hasFocus) {
                    if (hasFocus) {
                        mKeyboardRunnable = createShowKeyboardRunnable();
                        currentActivity.getWindow().getDecorView().post(mKeyboardRunnable);
                        currentFocusedView.getViewTreeObserver().removeOnWindowFocusChangeListener(this);
                    }
                }
            });
        }
    }

    private Runnable createShowKeyboardRunnable() {
        return new Runnable() {
            @Override
            public void run() {
                try {
                    Activity activity = mReactContext.getCurrentActivity();
                    View activeFocusedView = getCurrentFocusedView();
                    if (activeFocusedView != null && activity.getWindow().getDecorView().isShown()) {
                        InputMethodManager imm =
                            (InputMethodManager) mReactContext.getSystemService(Context.INPUT_METHOD_SERVICE);
                        imm.showSoftInput(activeFocusedView, InputMethodManager.SHOW_IMPLICIT);
                    }
                } catch (Exception e) {
                    // Noop
                }
            }
        };
    }

    private View getCurrentFocusedView() {
        Activity activity = mReactContext.getCurrentActivity();
        if (activity == null) {
            return null;
        }
        return activity.getCurrentFocus();
    }

    private boolean isAnyViewFocused() {
        View getCurrentFocusedView = getCurrentFocusedView();
        return getCurrentFocusedView != null;
    }

    @ReactMethod
    public void hideAndroidSoftKeyboard() {
        Activity currentActivity = mReactContext.getCurrentActivity();
        if (currentActivity != null) {
            View currentFocusedView = currentActivity.getCurrentFocus();
            if (currentFocusedView != null) {
                InputMethodManager imm =
                    (InputMethodManager) mReactContext.getSystemService(Context.INPUT_METHOD_SERVICE);
                imm.hideSoftInputFromWindow(currentFocusedView.getWindowToken(), 0);
            }
        }
    }

    @ReactMethod
    public void logException(final ReadableMap rawException, final Callback jsCallback) {
        GutenbergJsException exception = GutenbergJsException.fromReadableMap(rawException);
        LogExceptionCallback logExceptionCallback = onLogExceptionCallback(jsCallback);
        mGutenbergBridgeJS2Parent.logException(exception, logExceptionCallback);
    }

   private LogExceptionCallback onLogExceptionCallback(final Callback jsCallback) {
       return new GutenbergBridgeJS2Parent.LogExceptionCallback() {
           @Override public void onLogException(boolean success) {
               jsCallback.invoke(success);
           }
       };
   }
}
