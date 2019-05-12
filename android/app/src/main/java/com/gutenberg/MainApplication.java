package com.gutenberg;

import android.app.Application;
import android.util.Log;

import com.facebook.react.ReactApplication;
import com.brentvatne.react.ReactVideoPackage;
import com.horcrux.svg.SvgPackage;

import org.wordpress.mobile.ReactNativeAztec.ReactAztecPackage;
import org.wordpress.mobile.ReactNativeGutenbergBridge.GutenbergBridgeJS2Parent;
import org.wordpress.mobile.ReactNativeGutenbergBridge.RNReactNativeGutenbergBridgePackage;
import com.github.godness84.RNRecyclerViewList.RNRecyclerviewListPackage;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;

import java.util.Arrays;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {

  private static final String TAG = "MainApplication";

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
          new MainReactPackage(),
            new ReactVideoPackage(),
            new SvgPackage(),
            new ReactAztecPackage(),
            new RNRecyclerviewListPackage(),
            new RNReactNativeGutenbergBridgePackage(new GutenbergBridgeJS2Parent() {
                @Override
                public void responseHtml(String title, String html, boolean changed) {}

                @Override
                public void requestMediaPickFromMediaLibrary(MediaSelectedCallback mediaSelectedCallback, MediaType mediaType) {}

                @Override
                public void requestMediaPickFromDeviceLibrary(MediaUploadCallback mediaUploadCallback, MediaType mediaType) {}

                @Override
                public void requestMediaPickerFromDeviceCamera(MediaUploadCallback mediaUploadCallback, MediaType mediaType) {}

                @Override
                public void requestMediaImport(String url, MediaSelectedCallback mediaSelectedCallback) {}

                @Override
                public void mediaUploadSync(MediaUploadCallback mediaUploadCallback) {}

                @Override
                public void requestImageFailedRetryDialog(int mediaId) {}

                @Override
                public void requestImageUploadCancelDialog(int mediaId) {}

                @Override
                public void requestImageUploadCancel(int mediaId) {}

                @Override
                public void editorDidMount(boolean hasUnsupportedBlocks) {}

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
            })
      );
    }

    @Override
    protected String getJSMainModuleName() {
      return "index";
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
  }
}
