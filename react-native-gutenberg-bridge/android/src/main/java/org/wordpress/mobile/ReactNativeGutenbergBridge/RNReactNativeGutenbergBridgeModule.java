package org.wordpress.mobile.ReactNativeGutenbergBridge;

import android.support.annotation.Nullable;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

public class RNReactNativeGutenbergBridgeModule extends ReactContextBaseJavaModule {

    private final ReactApplicationContext mReactContext;
    private CountDownLatch mGetContentCountDownLatch;

    private String mContentHtml = "";

    public RNReactNativeGutenbergBridgeModule(ReactApplicationContext reactContext) {
        super(reactContext);
        mReactContext = reactContext;
    }

    @Override
    public String getName() {
        return "RNReactNativeGutenbergBridge";
    }


    private void emitToJS(String eventName, @Nullable WritableMap data) {
        mReactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, data);
    }

    public String getHtmlFromJS() {
        mGetContentCountDownLatch = new CountDownLatch(1);

        emitToJS("requestGetHtml", null);

        try {
            mGetContentCountDownLatch.await(10, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
//            AppLog.e(T.EDITOR, e);
            Thread.currentThread().interrupt();
        }

        return mContentHtml;
    }

    @ReactMethod
    public void provideToNative_Html(String html) {
        mContentHtml = html;
        mGetContentCountDownLatch.countDown();
    }
}
