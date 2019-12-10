package com.gutenberg;

import android.app.Application;
import android.util.Log;

import androidx.core.util.Consumer;

import com.facebook.react.ReactApplication;
import com.reactnativecommunity.slider.ReactSliderPackage;
import com.brentvatne.react.ReactVideoPackage;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.devsupport.interfaces.DevOptionHandler;
import com.facebook.react.devsupport.interfaces.DevSupportManager;
import com.horcrux.svg.SvgPackage;

import org.wordpress.mobile.ReactNativeAztec.ReactAztecPackage;
import org.wordpress.mobile.ReactNativeGutenbergBridge.GutenbergBridgeJS2Parent;
import org.wordpress.mobile.ReactNativeGutenbergBridge.RNReactNativeGutenbergBridgePackage;

import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;

import java.util.Arrays;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {

    private static final String TAG = "MainApplication";

    private ReactNativeHost mReactNativeHost;
    private RNReactNativeGutenbergBridgePackage mRnReactNativeGutenbergBridgePackage;

    private ReactNativeHost createReactNativeHost() {
        mRnReactNativeGutenbergBridgePackage = new RNReactNativeGutenbergBridgePackage(new GutenbergBridgeJS2Parent() {
            @Override
            public void responseHtml(String title, String html, boolean changed) {
            }

            @Override
            public void requestMediaImport(String url, MediaUploadCallback mediaUploadCallback) {
            }

            @Override
            public void requestMediaPickerFromDeviceCamera(MediaUploadCallback mediaUploadCallback, MediaType mediaType) {
            }

            @Override
            public void requestMediaPickFromDeviceLibrary(MediaUploadCallback mediaUploadCallback, Boolean allowMultipleSelection, MediaType mediaType) {
            }

            @Override
            public void requestMediaPickFromMediaLibrary(MediaUploadCallback mediaUploadCallback, Boolean allowMultipleSelection, MediaType mediaType) {
            }


            @Override
            public void mediaUploadSync(MediaUploadCallback mediaUploadCallback) {
            }

            @Override
            public void requestImageFailedRetryDialog(int mediaId) {
            }

            @Override
            public void requestImageUploadCancelDialog(int mediaId) {
            }

            @Override
            public void requestImageUploadCancel(int mediaId) {
            }

            @Override
            public void editorDidMount(ReadableArray unsupportedBlockNames) {
            }

            @Override
            public void editorDidAutosave() {
            }

            @Override
            public void getOtherMediaPickerOptions(OtherMediaOptionsReceivedCallback otherMediaOptionsReceivedCallback, MediaType mediaType) {

            }

            @Override
            public void requestMediaPickFrom(String mediaSource, MediaUploadCallback mediaUploadCallback, Boolean allowMultipleSelection) {

            }

            @Override
            public void requestImageFullscreenPreview(String mediaUrl) {

            }

            @Override
            public void editorDidEmitLog(String message, LogLevel logLevel) {
                switch (logLevel) {
                    case TRACE:
                        Log.d(TAG, message);
                        break;
                    case INFO:
                        Log.i(TAG, message);
                        break;
                    case WARN:
                        Log.w(TAG, message);
                        break;
                    case ERROR:
                        Log.e(TAG, message);
                        break;
                }
            }

            @Override
            public void performRequest(String path, Consumer<String> onSuccess, Consumer<String> onError) {}
        });

        return new ReactNativeHost(this) {
            @Override
            public boolean getUseDeveloperSupport() {
                return BuildConfig.DEBUG;
            }

            @Override
            protected List<ReactPackage> getPackages() {
                return Arrays.asList(
                        new MainReactPackage(),
                        new ReactSliderPackage(),
                        new ReactVideoPackage(),
                        new SvgPackage(),
                        new ReactAztecPackage(),
                        mRnReactNativeGutenbergBridgePackage);
            }

            @Override
            protected String getJSMainModuleName() {
                return "index";
            }
        };
    }

    @Override
    public ReactNativeHost getReactNativeHost() {
        if (mReactNativeHost == null) {
            mReactNativeHost = createReactNativeHost();
            createCustomDevOptions(mReactNativeHost);
        }

        return mReactNativeHost;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        SoLoader.init(this, /* native exopackage */ false);
    }

    private void createCustomDevOptions(ReactNativeHost reactNativeHost) {
        DevSupportManager devSupportManager = reactNativeHost.getReactInstanceManager().getDevSupportManager();

        devSupportManager.addCustomDevOption("Show html", new DevOptionHandler() {
            @Override
            public void onOptionSelected() {
                mRnReactNativeGutenbergBridgePackage.getRNReactNativeGutenbergBridgeModule().toggleEditorMode();
            }
        });
    }
}
