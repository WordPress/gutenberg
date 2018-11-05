package org.wordpress.mobile.ReactNativeGutenbergBridge;

import android.support.annotation.Nullable;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import org.wordpress.mobile.ReactNativeGutenbergBridge.GutenbergBridgeJS2Parent.MediaSelectedCallback;

public class RNReactNativeGutenbergBridgeModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext mReactContext;
    private final GutenbergBridgeJS2Parent mGutenbergBridgeJS2Parent;

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
        emitToJS("requestGetHtml", null);
    }

    @ReactMethod
    public void provideToNative_Html(String html) {
        mGutenbergBridgeJS2Parent.responseHtml(html);
    }

    @ReactMethod
    public void onMediaLibraryPress(final Callback onMediaSelected) {
        mGutenbergBridgeJS2Parent.onMediaLibraryPress(new MediaSelectedCallback() {
            @Override public void onMediaSelected(String mediaUrl) {
                onMediaSelected.invoke(mediaUrl);
            }
        });
    }
}
