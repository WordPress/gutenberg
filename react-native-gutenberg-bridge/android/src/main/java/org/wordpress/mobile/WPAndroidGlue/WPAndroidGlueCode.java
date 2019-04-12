package org.wordpress.mobile.WPAndroidGlue;

import android.app.Activity;
import android.app.Application;
import android.content.Context;
import android.content.MutableContextWrapper;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.support.v4.app.Fragment;
import android.text.TextUtils;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout.LayoutParams;

import com.facebook.imagepipeline.backends.okhttp3.OkHttpImagePipelineConfigFactory;
import com.facebook.imagepipeline.core.ImagePipelineConfig;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactInstanceManagerBuilder;
import com.facebook.react.ReactPackage;
import com.facebook.react.ReactRootView;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.common.LifecycleState;
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler;
import com.facebook.react.shell.MainPackageConfig;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;
import com.github.godness84.RNRecyclerViewList.RNRecyclerviewListPackage;
import com.horcrux.svg.SvgPackage;

import org.wordpress.android.util.AppLog;
import org.wordpress.mobile.ReactNativeAztec.ReactAztecPackage;
import org.wordpress.mobile.ReactNativeGutenbergBridge.GutenbergBridgeJS2Parent;
import org.wordpress.mobile.ReactNativeGutenbergBridge.GutenbergBridgeJS2Parent.MediaSelectedCallback;
import org.wordpress.mobile.ReactNativeGutenbergBridge.GutenbergBridgeJS2Parent.MediaUploadCallback;
import org.wordpress.mobile.ReactNativeGutenbergBridge.RNReactNativeGutenbergBridgePackage;

import java.lang.ref.WeakReference;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import okhttp3.OkHttpClient;


public class WPAndroidGlueCode {
    private ReactRootView mReactRootView;
    private ReactInstanceManager mReactInstanceManager;
    private ReactContext mReactContext;
    private RNReactNativeGutenbergBridgePackage mRnReactNativeGutenbergBridgePackage;
    private MediaSelectedCallback mPendingMediaSelectedCallback;
    private MediaUploadCallback mPendingMediaUploadCallback;
    private boolean mMediaPickedByUserOnBlock;

    private OnMediaLibraryButtonListener mOnMediaLibraryButtonListener;
    private OnReattachQueryListener mOnReattachQueryListener;
    private OnEditorMountListener mOnEditorMountListener;
    private boolean mIsEditorMounted;

    private String mContentHtml = "";
    private boolean mContentInitialized;
    private HashMap<Integer, String> mMediaToAddAfterMounting = new HashMap<>();
    private String mTitle = "";
    private boolean mTitleInitialized;
    private boolean mContentChanged;
    private boolean mShouldUpdateContent;
    private CountDownLatch mGetContentCountDownLatch;
    private WeakReference<View> mLastFocusedView = null;

    private static final String PROP_NAME_INITIAL_DATA = "initialData";
    private static final String PROP_NAME_INITIAL_TITLE = "initialTitle";
    private static final String PROP_NAME_INITIAL_HTML_MODE_ENABLED = "initialHtmlModeEnabled";
    private static final String PROP_NAME_LOCALE = "locale";
    private static final String PROP_NAME_TRANSLATIONS = "translations";

    private static OkHttpHeaderInterceptor sAddCookiesInterceptor = new OkHttpHeaderInterceptor();
    private static OkHttpClient sOkHttpClient = new OkHttpClient.Builder().addInterceptor(sAddCookiesInterceptor).build();

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
        void onMediaLibraryButtonClicked();
        void onUploadMediaButtonClicked();
        void onCapturePhotoButtonClicked();
        void onRetryUploadForMediaClicked(int mediaId);
        void onCancelUploadForMediaClicked(int mediaId);
        void onCancelUploadForMediaDueToDeletedBlock(int mediaId);
    }

    public interface OnReattachQueryListener {
        void onQueryCurrentProgressForUploadingMedia();
    }

    public interface OnEditorMountListener {
        void onEditorDidMount(boolean hasUnsupportedBlocks);
    }

    public interface OnAuthHeaderRequestedListener {
        String onAuthHeaderRequested(String url);
    }

    protected List<ReactPackage> getPackages() {
        mRnReactNativeGutenbergBridgePackage = new RNReactNativeGutenbergBridgePackage(new GutenbergBridgeJS2Parent() {
            @Override
            public void responseHtml(String title, String html, boolean changed) {
                mContentHtml = html;
                mTitle = title;
                // This code is called twice. When getTitle and getContent are called.
                // Make sure mContentChanged has the correct value (true) if one of the call returned with changes.
                mContentChanged = mContentChanged || changed;
                mGetContentCountDownLatch.countDown();
            }

            @Override
            public void requestMediaPickFromMediaLibrary(MediaSelectedCallback mediaSelectedCallback) {
                mMediaPickedByUserOnBlock = true;
                mPendingMediaSelectedCallback = mediaSelectedCallback;
                mOnMediaLibraryButtonListener.onMediaLibraryButtonClicked();
            }

            @Override
            public void requestMediaPickFromDeviceLibrary(MediaUploadCallback mediaUploadCallback) {
                mMediaPickedByUserOnBlock = true;
                mPendingMediaUploadCallback = mediaUploadCallback;
                mOnMediaLibraryButtonListener.onUploadMediaButtonClicked();
            }

            @Override
            public void requestMediaPickerFromDeviceCamera(MediaUploadCallback mediaUploadCallback) {
                mMediaPickedByUserOnBlock = true;
                mPendingMediaUploadCallback = mediaUploadCallback;
                mOnMediaLibraryButtonListener.onCapturePhotoButtonClicked();
            }

            @Override
            public void requestMediaImport(String url, MediaSelectedCallback mediaSelectedCallback) {
                // no op - we still don't have a way to paste images, but the method needs to exist
                // to match the iOS counterpart
            }

            @Override
            public void mediaUploadSync(MediaUploadCallback mediaUploadCallback) {
                mPendingMediaUploadCallback = mediaUploadCallback;
                mOnReattachQueryListener.onQueryCurrentProgressForUploadingMedia();
            }

            @Override
            public void requestImageFailedRetryDialog(int mediaId) {
                mOnMediaLibraryButtonListener.onRetryUploadForMediaClicked(mediaId);
            }

            @Override
            public void requestImageUploadCancelDialog(int mediaId) {
                mOnMediaLibraryButtonListener.onCancelUploadForMediaClicked(mediaId);
            }

            @Override
            public void requestImageUploadCancel(int mediaId) {
                mOnMediaLibraryButtonListener.onCancelUploadForMediaDueToDeletedBlock(mediaId);
            }

            @Override
            public void editorDidMount(boolean hasUnsupportedBlocks) {
                mOnEditorMountListener.onEditorDidMount(hasUnsupportedBlocks);
                mIsEditorMounted = true;
                if (TextUtils.isEmpty(mTitle) && TextUtils.isEmpty(mContentHtml)) {
                    setFocusOnTitle();
                    // send signal to Editor to create a new image block and pass the media URL, start uploading, etc
                    // use mMediaUrlToAddAfterMounting
                    dispatchOneMediaToAddAtATimeIfAvailable();
                }
            }

            @Override
            public void editorDidEmitLog(String message, LogLevel logLevel) {
                switch (logLevel) {
                    case TRACE:
                        AppLog.d(AppLog.T.EDITOR, message);
                        break;
                    case INFO:
                        AppLog.i(AppLog.T.EDITOR, message);
                        break;
                    case WARN:
                        AppLog.w(AppLog.T.EDITOR, message);
                        break;
                    case ERROR:
                        AppLog.e(AppLog.T.EDITOR, message);
                        break;
                }
            }
        });


        return Arrays.asList(
                new MainReactPackage(getMainPackageConfig(getImagePipelineConfig(sOkHttpClient))),
                new SvgPackage(),
                new ReactAztecPackage(),
                new RNRecyclerviewListPackage(),
                mRnReactNativeGutenbergBridgePackage);
    }

    private MainPackageConfig getMainPackageConfig(ImagePipelineConfig imagePipelineConfig) {
        return new MainPackageConfig.Builder().setFrescoConfig(imagePipelineConfig).build();
    }

    private ImagePipelineConfig getImagePipelineConfig(OkHttpClient client) {
        return  OkHttpImagePipelineConfigFactory
                .newBuilder(mReactRootView.getContext(), client).build();
    }

    public void onCreateView(Context initContext, boolean htmlModeEnabled,
                             Application application, boolean isDebug, boolean buildGutenbergFromSource,
                             boolean isNewPost, String localeString, Bundle translations) {
        mReactRootView = new ReactRootView(new MutableContextWrapper(initContext));

        ReactInstanceManagerBuilder builder =
                ReactInstanceManager.builder()
                                    .setApplication(application)
                                    .setJSMainModulePath("index")
                                    .addPackages(getPackages())
                                    .setUseDeveloperSupport(isDebug)
                                    .setInitialLifecycleState(LifecycleState.BEFORE_CREATE);
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
        initialProps.putString(PROP_NAME_INITIAL_TITLE, "");
        initialProps.putBoolean(PROP_NAME_INITIAL_HTML_MODE_ENABLED, htmlModeEnabled);
        initialProps.putString(PROP_NAME_LOCALE, localeString);
        initialProps.putBundle(PROP_NAME_TRANSLATIONS, translations);

        // The string here (e.g. "MyReactNativeApp") has to match
        // the string in AppRegistry.registerComponent() in index.js
        mReactRootView.setAppProperties(initialProps);
    }

    public void attachToContainer(ViewGroup viewGroup, OnMediaLibraryButtonListener onMediaLibraryButtonListener,
                                  OnReattachQueryListener onReattachQueryListener,
                                  OnEditorMountListener onEditorMountListener,
                                  OnAuthHeaderRequestedListener onAuthHeaderRequestedListener) {
        MutableContextWrapper contextWrapper = (MutableContextWrapper) mReactRootView.getContext();
        contextWrapper.setBaseContext(viewGroup.getContext());

        mOnMediaLibraryButtonListener = onMediaLibraryButtonListener;
        mOnReattachQueryListener = onReattachQueryListener;
        mOnEditorMountListener = onEditorMountListener;

        sAddCookiesInterceptor.setOnAuthHeaderRequestedListener(onAuthHeaderRequestedListener);

        if (mReactRootView.getParent() != null) {
            ((ViewGroup) mReactRootView.getParent()).removeView(mReactRootView);
        }

        viewGroup.addView(mReactRootView, 0,
                new LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        refocus();
    }

    private void refocus() {
        if (mLastFocusedView != null) {
            // schedule a request for focus
            new Handler(Looper.getMainLooper()).post(new Runnable() {
                @Override public void run() {
                    // Check if View reference is still alive and in the view hierarchy
                    if (mLastFocusedView != null
                            && mLastFocusedView.get() != null
                            && mLastFocusedView.get().getParent() != null) {
                        // request focus to the last focused child
                        mLastFocusedView.get().requestFocus();
                    }
                }
            });
        }
    }

    public void onPause(Activity activity) {
        if (mReactInstanceManager != null) {
            // get the focused view so we re-focus it later if needed. WeakReference so we don't leak it.
            mLastFocusedView = new WeakReference<>(mReactRootView.findFocus());

            mReactInstanceManager.onHostPause(activity);
        }
    }

    public void onResume(final Fragment fragment, final Activity activity) {
        if (mReactInstanceManager != null) {
            mReactInstanceManager.onHostResume(activity,
                    new DefaultHardwareBackBtnHandler() {
                        @Override
                        public void invokeDefaultOnBackPressed() {
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
            sAddCookiesInterceptor.setOnAuthHeaderRequestedListener(null);
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

    public void setFocusOnTitle() {
        mRnReactNativeGutenbergBridgePackage.getRNReactNativeGutenbergBridgeModule().setFocusOnTitleInJS();
    }

    public void appendNewImageBlock(int mediaId, String mediaUri) {
        mRnReactNativeGutenbergBridgePackage.getRNReactNativeGutenbergBridgeModule()
                                            .appendNewImageBlock(mediaId, mediaUri);
    }

    public void setTitle(String title) {
        mTitleInitialized = true;
        mTitle = title;
        setContent(mTitle, mContentHtml);
    }

    public void setContent(String postContent) {
        mContentInitialized = true;
        mContentHtml = postContent;
        setContent(mTitle, mContentHtml);
    }

    public boolean hasReceivedInitialTitleAndContent() {
        return mTitleInitialized && mContentInitialized;
    }

    private void setContent(String title, String postContent) {
        if (mReactRootView == null) {
            return;
        }

        // wait for both title and content to have been set at least once. Legacy editor implementation had the two as
        // separate calls but, we only want a single call to correctly boot the GB editor
        if (!hasReceivedInitialTitleAndContent()) {
            return;
        }

        // Content can be set directly to RootView only once (per RootView instance)
        // because we don't want to bootstrap the whole Gutenberg state.
        // Otherwise it should be done through module interface
        if (mShouldUpdateContent) {
            updateContent(title, postContent);
        } else {
            mShouldUpdateContent = true;
            initContent(title, postContent);
        }
    }

    private void initContent(String title, String content) {
        Bundle appProps = mReactRootView.getAppProperties();
        if (appProps == null) {
            appProps = new Bundle();
        }
        if (content != null) {
            appProps.putString(PROP_NAME_INITIAL_DATA, content);
            mContentHtml = content;
        }
        if (title != null) {
            appProps.putString(PROP_NAME_INITIAL_TITLE, title);
            mTitle = title;
        }
        mReactRootView.startReactApplication(mReactInstanceManager, "gutenberg", appProps);
    }

    private void updateContent(String title, String content) {
        if (content != null) {
            mContentHtml = content;
        }
        if (title != null) {
            mTitle = title;
        }
        if (mReactContext != null) {
            if (content != null) {
                mRnReactNativeGutenbergBridgePackage.getRNReactNativeGutenbergBridgeModule().setHtmlInJS(content);
            }
            if (title != null) {
                mRnReactNativeGutenbergBridgePackage.getRNReactNativeGutenbergBridgeModule().setTitleInJS(title);
            }
        }
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

    public CharSequence getTitle(OnGetContentTimeout onGetContentTimeout) {
        if (mReactContext != null) {
            mGetContentCountDownLatch = new CountDownLatch(1);

            mRnReactNativeGutenbergBridgePackage.getRNReactNativeGutenbergBridgeModule().getHtmlFromJS();

            try {
                mGetContentCountDownLatch.await(10, TimeUnit.SECONDS);
            } catch (InterruptedException ie) {
                onGetContentTimeout.onGetContentTimeout(ie);
            }

            return mTitle == null ? "" : mTitle;
        } else {
            // TODO: Add app logging here
        }

        return "";
    }

    public void appendMediaFile(int mediaId, final String mediaUrl) {
        if (mPendingMediaSelectedCallback != null && mMediaPickedByUserOnBlock) {
            mMediaPickedByUserOnBlock = false;
            mPendingMediaSelectedCallback.onMediaSelected(mediaId, mediaUrl);
            mPendingMediaSelectedCallback = null;
        } else {
            // we can assume we're being passed a new image from share intent as there was no selectMedia callback
            sendOrDeferAppendMediaSignal(mediaId, mediaUrl);
        }
    }

    public void toggleEditorMode() {
        mRnReactNativeGutenbergBridgePackage.getRNReactNativeGutenbergBridgeModule().toggleEditorMode();
    }

    public void appendUploadMediaFile(final int mediaId, final String mediaUri) {
       if (isMediaUploadCallbackRegistered() && mMediaPickedByUserOnBlock) {
           mMediaPickedByUserOnBlock = false;
           mPendingMediaUploadCallback.onUploadMediaFileSelected(mediaId, mediaUri);
       } else {
           // we can assume we're being passed a new image from share intent as there was no selectMedia callback
           sendOrDeferAppendMediaSignal(mediaId, mediaUri);
       }
    }

    private void sendOrDeferAppendMediaSignal(int mediaId, final String mediaUri) {
        // if editor is mounted, let's append the media file
        if (mIsEditorMounted) {
            if (!TextUtils.isEmpty(mediaUri) && mediaId > 0) {
                // send signal to JS
                appendNewImageBlock(mediaId, mediaUri);
            }
        } else {
            // save the URL, we'll add it once Editor is mounted
            synchronized (WPAndroidGlueCode.this) {
                mMediaToAddAfterMounting.put(mediaId, mediaUri);
            }
        }
    }

    private synchronized void dispatchOneMediaToAddAtATimeIfAvailable() {
        Iterator<Entry<Integer, String>> iter = mMediaToAddAfterMounting.entrySet().iterator();
        while (iter.hasNext()) {
            Map.Entry<Integer, String> entry = iter.next();
            Integer mediaId = entry.getKey();
            String mediaUrl = entry.getValue();
            if (!TextUtils.isEmpty(mediaUrl) && mediaId > 0) {
                // send signal to JS
                appendNewImageBlock(mediaId, mediaUrl);
                iter.remove();
            }
        }
    }

    public void mediaFileUploadProgress(final int mediaId, final float progress) {
        if (isMediaUploadCallbackRegistered()) {
            mPendingMediaUploadCallback.onMediaFileUploadProgress(mediaId, progress);
        }
    }

    public void mediaFileUploadFailed(final int mediaId) {
        if (isMediaUploadCallbackRegistered()) {
            mPendingMediaUploadCallback.onMediaFileUploadFailed(mediaId);
        }
    }

    public void mediaFileUploadSucceeded(final int mediaId, final String mediaUrl, final int serverMediaId) {
        if (isMediaUploadCallbackRegistered()) {
            mPendingMediaUploadCallback.onMediaFileUploadSucceeded(mediaId, mediaUrl, serverMediaId);
        }
    }

    public void clearMediaFileURL(final int mediaId) {
        if (isMediaUploadCallbackRegistered()) {
            mPendingMediaUploadCallback.onUploadMediaFileClear(mediaId);
        }
    }

    private boolean isMediaUploadCallbackRegistered() {
        return mPendingMediaUploadCallback != null;
    }
}

