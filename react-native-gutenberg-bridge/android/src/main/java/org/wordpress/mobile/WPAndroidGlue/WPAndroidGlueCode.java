package org.wordpress.mobile.WPAndroidGlue;

import android.app.Activity;
import android.app.Application;
import android.content.Context;
import android.os.Bundle;
import android.support.v4.app.Fragment;
import android.view.View;

import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactInstanceManagerBuilder;
import com.facebook.react.ReactPackage;
import com.facebook.react.ReactRootView;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.common.LifecycleState;
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;
import com.github.godness84.RNRecyclerViewList.RNRecyclerviewListPackage;
import com.horcrux.svg.SvgPackage;

import org.wordpress.mobile.ReactNativeAztec.ReactAztecPackage;
import org.wordpress.mobile.ReactNativeGutenbergBridge.GutenbergBridgeJS2Parent;
import org.wordpress.mobile.ReactNativeGutenbergBridge.GutenbergBridgeJS2Parent.MediaSelectedCallback;
import org.wordpress.mobile.ReactNativeGutenbergBridge.RNReactNativeGutenbergBridgePackage;

import java.util.Arrays;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

public class WPAndroidGlueCode {
    private ReactRootView mReactRootView;
    private ReactInstanceManager mReactInstanceManager;
    private ReactContext mReactContext;
    private RNReactNativeGutenbergBridgePackage mRnReactNativeGutenbergBridgePackage;
    private MediaSelectedCallback mPendingMediaSelectedCallback;

    private String mContentHtml = "";
    private boolean mContentChanged;
    private CountDownLatch mGetContentCountDownLatch;

    private static final String PROP_NAME_INITIAL_DATA = "initialData";

    public void onCreate(Context context) {
        SoLoader.init(context, /* native exopackage */ false);
    }

    public boolean hasReactRootView() {
        return mReactRootView != null;
    }

    public boolean hasReactContext() {
        return mReactContext != null;
    }

    public boolean isContentChanged() {
        return mContentChanged;
    }

    public interface OnMediaLibraryButtonListener {
        void onMediaLibraryButtonClick();
    }

    protected List<ReactPackage> getPackages(final OnMediaLibraryButtonListener onMediaLibraryButtonListener) {
        mRnReactNativeGutenbergBridgePackage = new RNReactNativeGutenbergBridgePackage(new GutenbergBridgeJS2Parent() {
            @Override
            public void responseHtml(String html, boolean changed) {
                mContentHtml = html;
                mContentChanged = changed;
                mGetContentCountDownLatch.countDown();
            }

            @Override public void onMediaLibraryPress(MediaSelectedCallback mediaSelectedCallback) {
                mPendingMediaSelectedCallback = mediaSelectedCallback;
                onMediaLibraryButtonListener.onMediaLibraryButtonClick();
            }
        });
        return Arrays.asList(
                new MainReactPackage(),
                new SvgPackage(),
                new ReactAztecPackage(),
                new RNRecyclerviewListPackage(),
                mRnReactNativeGutenbergBridgePackage);
    }

    public void onCreateView(View reactRootView, OnMediaLibraryButtonListener onMediaLibraryButtonListener,
                             Application application, boolean isDebug, boolean buildGutenbergFromSource) {
        mReactRootView = (ReactRootView) reactRootView;

        ReactInstanceManagerBuilder builder =
                ReactInstanceManager.builder()
                                    .setApplication(application)
                                    .setJSMainModulePath("index")
                                    .addPackages(getPackages(onMediaLibraryButtonListener))
                                    .setUseDeveloperSupport(isDebug)
                                    .setInitialLifecycleState(LifecycleState.RESUMED);
        if (!buildGutenbergFromSource) {
            builder.setBundleAssetName("index.android.bundle");
        }
        mReactInstanceManager = builder.build();
        mReactInstanceManager.addReactInstanceEventListener(new ReactInstanceManager.ReactInstanceEventListener() {
            @Override
            public void onReactContextInitialized(ReactContext context) {
                mReactContext = context;
            }
        });
        Bundle initialProps = mReactRootView.getAppProperties();
        if (initialProps == null) {
            initialProps = new Bundle();
        }
        initialProps.putString(PROP_NAME_INITIAL_DATA, "");


        // The string here (e.g. "MyReactNativeApp") has to match
        // the string in AppRegistry.registerComponent() in index.js
        mReactRootView.startReactApplication(mReactInstanceManager, "gutenberg", initialProps);
    }

    public void onPause(Activity activity) {
        if (mReactInstanceManager != null) {
            mReactInstanceManager.onHostPause(activity);
        }
    }

    public void onResume(final Fragment fragment, final Activity activity) {
        if (mReactInstanceManager != null) {
            mReactInstanceManager.onHostResume(activity,
                    new DefaultHardwareBackBtnHandler() {
                        @Override public void invokeDefaultOnBackPressed() {
                            if (fragment.isAdded()) {
                                activity.onBackPressed();
                            }
                        }
                    });
        }
    }

    public void onDestroy(Activity activity) {
        if (mReactRootView != null) {
            mReactRootView.unmountReactApplication();
            mReactRootView = null;
        }
        if (mReactInstanceManager != null) {
            // onDestroy may be called on a ReactFragment after another ReactFragment has been
            // created and resumed with the same React Instance Manager. Make sure we only clean up
            // host's React Instance Manager if no other React Fragment is actively using it.
            if (mReactInstanceManager.getLifecycleState() != LifecycleState.RESUMED) {
                mReactInstanceManager.onHostDestroy(activity);
            }
        }
    }

    public void showDevOptionsDialog() {
        mReactInstanceManager.showDevOptionsDialog();
    }

    public void setContent(String postContent) {
        if (mReactRootView == null) {
            return;
        }

        Bundle appProps = mReactRootView.getAppProperties();
        if (appProps == null) {
            appProps = new Bundle();
        }
        appProps.putString(PROP_NAME_INITIAL_DATA, postContent);
        mReactRootView.setAppProperties(appProps);
    }

    public interface OnGetContentTimeout {
        void onGetContentTimeout(InterruptedException ie);
    }

    public CharSequence getContent(CharSequence originalContent, OnGetContentTimeout onGetContentTimeout) {
        if (mReactContext != null) {
            mGetContentCountDownLatch = new CountDownLatch(1);

            mRnReactNativeGutenbergBridgePackage.getRNReactNativeGutenbergBridgeModule().getHtmlFromJS();

            try {
                mGetContentCountDownLatch.await(10, TimeUnit.SECONDS);
            } catch (InterruptedException ie) {
                onGetContentTimeout.onGetContentTimeout(ie);
            }

            return mContentChanged ? (mContentHtml == null ? "" : mContentHtml) : originalContent;
        } else {
            // TODO: Add app logging here
        }

        return originalContent;
    }

    public void appendMediaFile(final String mediaUrl) {
        if (mPendingMediaSelectedCallback != null) {
            mPendingMediaSelectedCallback.onMediaSelected(mediaUrl);
            mPendingMediaSelectedCallback = null;
        }
    }
}

