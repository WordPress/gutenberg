package org.wordpress.mobile.WPAndroidGlue;

import android.app.Activity;
import android.app.Application;
import android.content.Context;
import android.content.MutableContextWrapper;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.text.TextUtils;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout.LayoutParams;

import androidx.annotation.Nullable;
import androidx.core.util.Consumer;
import androidx.core.util.Pair;
import androidx.fragment.app.Fragment;

import com.brentvatne.react.ReactVideoPackage;
import com.facebook.hermes.reactexecutor.HermesExecutorFactory;
import com.facebook.imagepipeline.backends.okhttp3.OkHttpImagePipelineConfigFactory;
import com.facebook.imagepipeline.core.ImagePipelineConfig;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactInstanceManagerBuilder;
import com.facebook.react.ReactPackage;
import com.facebook.react.ReactRootView;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.common.LifecycleState;
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler;
import com.facebook.react.shell.MainPackageConfig;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;
import com.horcrux.svg.SvgPackage;
import com.BV.LinearGradient.LinearGradientPackage;
import com.reactnativecommunity.clipboard.ClipboardPackage;
import com.reactnativecommunity.slider.ReactSliderPackage;
import org.linusu.RNGetRandomValuesPackage;
import com.reactnativecommunity.webview.RNCWebViewPackage;
import com.swmansion.gesturehandler.RNGestureHandlerPackage;
import com.swmansion.reanimated.ReanimatedPackage;
import com.swmansion.rnscreens.RNScreensPackage;
import com.th3rdwave.safeareacontext.SafeAreaContextPackage;
import org.reactnative.maskedview.RNCMaskedViewPackage;
import com.dylanvann.fastimage.FastImageViewPackage;

import org.wordpress.android.util.AppLog;
import org.wordpress.android.util.AppLog.T;
import org.wordpress.mobile.ReactNativeAztec.ReactAztecPackage;
import org.wordpress.mobile.ReactNativeGutenbergBridge.BuildConfig;
import org.wordpress.mobile.ReactNativeGutenbergBridge.GutenbergBridgeJS2Parent;
import org.wordpress.mobile.ReactNativeGutenbergBridge.GutenbergBridgeJS2Parent.MediaSelectedCallback;
import org.wordpress.mobile.ReactNativeGutenbergBridge.GutenbergBridgeJS2Parent.ReplaceUnsupportedBlockCallback;
import org.wordpress.mobile.ReactNativeGutenbergBridge.RNMedia;
import org.wordpress.mobile.ReactNativeGutenbergBridge.RNReactNativeGutenbergBridgePackage;

import java.lang.ref.WeakReference;
import java.util.ArrayList;
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
    private MediaSelectedCallback mMediaSelectedCallback;
    private DeferredEventEmitter mDeferredEventEmitter = new DeferredEventEmitter();
    private boolean mMediaPickedByUserOnBlock;

    /**
     * Flag to append as siblings when allowMultipleSelection = false is not respected
     */
    private boolean mAppendsMultipleSelectedToSiblingBlocks = false;

    private OnMediaLibraryButtonListener mOnMediaLibraryButtonListener;
    private OnReattachMediaUploadQueryListener mOnReattachMediaUploadQueryListener;
    private OnReattachMediaSavingQueryListener mOnReattachMediaSavingQueryListener;
    private OnSetFeaturedImageListener mOnSetFeaturedImageListener;
    private OnEditorMountListener mOnEditorMountListener;
    private OnEditorAutosaveListener mOnEditorAutosaveListener;
    private OnImageFullscreenPreviewListener mOnImageFullscreenPreviewListener;
    private OnMediaEditorListener mOnMediaEditorListener;
    private OnGutenbergDidRequestUnsupportedBlockFallbackListener mOnGutenbergDidRequestUnsupportedBlockFallbackListener;
    private OnGutenbergDidRequestEmbedFullscreenPreviewListener mOnGutenbergDidRequestEmbedFullscreenPreviewListener;
    private OnGutenbergDidSendButtonPressedActionListener mOnGutenbergDidSendButtonPressedActionListener;
    private ReplaceUnsupportedBlockCallback mReplaceUnsupportedBlockCallback;
    private OnMediaFilesCollectionBasedBlockEditorListener mOnMediaFilesCollectionBasedBlockEditorListener;
    private OnFocalPointPickerTooltipShownEventListener mOnFocalPointPickerTooltipShownListener;
    private OnGutenbergDidRequestPreviewListener mOnGutenbergDidRequestPreviewListener;
    private OnBlockTypeImpressionsEventListener mOnBlockTypeImpressionsEventListener;
    private OnCustomerSupportOptionsListener mOnCustomerSupportOptionsListener;
    private OnSendEventToHostListener mOnSendEventToHostListener;

    private OnToggleUndoButtonListener mOnToggleUndoButtonListener;

    private OnToggleRedoButtonListener mOnToggleRedoButtonListener;
    private OnConnectionStatusEventListener mOnConnectionStatusEventListener;
    private OnBackHandlerEventListener mOnBackHandlerEventListener;
    private boolean mIsEditorMounted;

    private String mContentHtml = "";
    private boolean mContentInitialized;
    private HashMap<Integer, Media> mMediaToAddAfterMounting = new HashMap<>();
    private String mTitle = "";
    private boolean mTitleInitialized;
    private boolean mContentChanged;
    private ReadableMap mContentInfo;
    private boolean mShouldUpdateContent;
    private CountDownLatch mGetContentCountDownLatch;
    private WeakReference<View> mLastFocusedView = null;
    private RequestExecutor mRequestExecutor;
    private ShowSuggestionsUtil mShowSuggestionsUtil;
    private @Nullable Bundle mEditorTheme = null;

    private static OkHttpHeaderInterceptor sAddCookiesInterceptor = new OkHttpHeaderInterceptor();
    private static OkHttpClient sOkHttpClient = new OkHttpClient.Builder().addInterceptor(sAddCookiesInterceptor).build();
    private boolean mIsDarkMode;
    private Consumer<Exception> mExceptionLogger;
    private Consumer<String> mBreadcrumbLogger;
    private boolean mShouldHandleBackPress = false;

    public void onCreate(Context context) {
        SoLoader.init(context, /* native exopackage */ false);
    }

    public boolean hasReactRootView() {
        return mReactRootView != null;
    }

    public boolean hasReactContext() {
        return mReactContext != null;
    }

    public boolean shouldHandleBackPress() {
        return mShouldHandleBackPress;
    }

    public boolean isContentChanged() {
        return mContentChanged;
    }

    public interface OnMediaLibraryButtonListener {
        void onMediaLibraryImageButtonClicked(boolean allowMultipleSelection);
        void onMediaLibraryVideoButtonClicked(boolean allowMultipleSelection);
        void onMediaLibraryMediaButtonClicked(boolean allowMultipleSelection);
        void onMediaLibraryFileButtonClicked(boolean allowMultipleSelection);
        void onMediaLibraryAudioButtonClicked(boolean allowMultipleSelection);
        void onUploadPhotoButtonClicked(boolean allowMultipleSelection);
        void onCapturePhotoButtonClicked();
        void onUploadVideoButtonClicked(boolean allowMultipleSelection);
        void onUploadMediaButtonClicked(boolean allowMultipleSelection);
        void onCaptureVideoButtonClicked();
        void onRetryUploadForMediaClicked(int mediaId);
        void onCancelUploadForMediaClicked(int mediaId);
        void onCancelUploadForMediaDueToDeletedBlock(int mediaId);
        ArrayList<MediaOption> onGetOtherMediaImageOptions();
        ArrayList<MediaOption> onGetOtherMediaFileOptions();
        ArrayList<MediaOption> onGetOtherMediaAudioFileOptions();
        void onOtherMediaButtonClicked(String mediaSource, boolean allowMultipleSelection);
    }

    public interface OnMediaFilesCollectionBasedBlockEditorListener {
        void onRequestMediaFilesEditorLoad(ArrayList<Object> mediaFiles, String blockId);
        void onCancelUploadForMediaCollection(ArrayList<Object> mediaFiles);
        void onRetryUploadForMediaCollection(ArrayList<Object> mediaFiles);
        void onCancelSaveForMediaCollection(ArrayList<Object> mediaFiles);
        void onMediaFilesBlockReplaceSync(ArrayList<Object> mediaFiles, String blockId);
    }

    public interface OnImageFullscreenPreviewListener {
        void onImageFullscreenPreviewClicked(String mediaUrl);
    }

    public interface OnReattachMediaUploadQueryListener {
        void onQueryCurrentProgressForUploadingMedia();
    }

    public interface OnReattachMediaSavingQueryListener {
        void onQueryCurrentProgressForSavingMedia();
    }

    public interface OnSetFeaturedImageListener {
        void onSetFeaturedImageButtonClicked(int mediaId);
    }

    public interface OnEditorMountListener {
        void onEditorDidMount(ArrayList<Object> unsupportedBlockNames);
    }

    public interface OnAuthHeaderRequestedListener {
        Map<String, String> onAuthHeaderRequested(String url);
    }

    public interface OnEditorAutosaveListener {
        void onEditorAutosave();
    }

    public interface OnMediaEditorListener {
        void onMediaEditorClicked(String mediaUrl);
    }

    public interface OnGutenbergDidRequestUnsupportedBlockFallbackListener {
        void gutenbergDidRequestUnsupportedBlockFallback(UnsupportedBlock unsupportedBlock);
    }

    public interface OnGutenbergDidRequestEmbedFullscreenPreviewListener {
        void gutenbergDidRequestEmbedFullscreenPreview(String html, String title);
    }

    public interface OnGutenbergDidSendButtonPressedActionListener {
        void gutenbergDidSendButtonPressedAction(String buttonType);
    }

    public interface OnFocalPointPickerTooltipShownEventListener {
        void onSetFocalPointPickerTooltipShown(boolean tooltipShown);
        boolean onRequestFocalPointPickerTooltipShown();
    }

    public interface OnContentInfoReceivedListener {
        void onContentInfoFailed();
        void onEditorNotReady();
        void onContentInfoReceived(HashMap<String, Object> contentInfo);
    }

    public interface OnGutenbergDidRequestPreviewListener {
        void gutenbergDidRequestPreview();
    }

    public interface OnBlockTypeImpressionsEventListener {
        void onSetBlockTypeImpressions(Map<String, Double> impressions);
        Map<String, Double> onRequestBlockTypeImpressions();
    }

    public interface OnCustomerSupportOptionsListener {
        void onContactCustomerSupport();
        void onGotoCustomerSupportOptions();
    }

    public interface OnSendEventToHostListener {
        void onSendEventToHost(String eventName, Map<String, Object> properties);
    }

    public interface OnToggleUndoButtonListener {
        void onToggleUndoButton(boolean isDisabled);
    }

    public interface OnToggleRedoButtonListener {
        void onToggleRedoButton(boolean isDisabled);
    }

    public interface OnConnectionStatusEventListener {
        boolean onRequestConnectionStatus();
    }

    public interface OnBackHandlerEventListener {
        void onBackHandler();
    }

    public void mediaSelectionCancelled() {
        mAppendsMultipleSelectedToSiblingBlocks = false;
    }

    protected List<ReactPackage> getPackages() {
        mRnReactNativeGutenbergBridgePackage = new RNReactNativeGutenbergBridgePackage(new GutenbergBridgeJS2Parent() {
            @Override
            public void responseHtml(String title, String html, boolean changed, ReadableMap contentInfo) {
                mContentHtml = html;
                mTitle = title;
                // This code is called twice. When getTitle and getContent are called.
                // Make sure mContentChanged has the correct value (true) if one of the call returned with changes.
                mContentChanged = mContentChanged || changed;

                mContentInfo = contentInfo;

                // Gutenberg mobile sends us html response even without we asking for it so, check if the latch is there.
                //  This is probably an indication of a bug on the RN side of things though.
                //  Related: https://github.com/WordPress/gutenberg/pull/16260#issuecomment-506727286
                if (mGetContentCountDownLatch != null) {
                    mGetContentCountDownLatch.countDown();
                }
            }

            @Override
            public void requestMediaPickFromMediaLibrary(MediaSelectedCallback mediaSelectedCallback, Boolean allowMultipleSelection, MediaType mediaType) {
                mMediaPickedByUserOnBlock = true;
                mAppendsMultipleSelectedToSiblingBlocks = !allowMultipleSelection;
                mMediaSelectedCallback = mediaSelectedCallback;
                switch (mediaType) {
                    case IMAGE:
                        mOnMediaLibraryButtonListener.onMediaLibraryImageButtonClicked(allowMultipleSelection);
                        break;
                    case VIDEO:
                        mOnMediaLibraryButtonListener.onMediaLibraryVideoButtonClicked(allowMultipleSelection);
                        break;
                    case MEDIA:
                        mOnMediaLibraryButtonListener.onMediaLibraryMediaButtonClicked(allowMultipleSelection);
                        break;
                    case AUDIO:
                        mOnMediaLibraryButtonListener.onMediaLibraryAudioButtonClicked(allowMultipleSelection);
                        break;
                    case ANY:
                        mOnMediaLibraryButtonListener.onMediaLibraryFileButtonClicked(allowMultipleSelection);
                        break;
                    case OTHER:
                        break;
                }
            }

            @Override
            public void requestMediaPickFromDeviceLibrary(MediaSelectedCallback mediaSelectedCallback, Boolean allowMultipleSelection, MediaType mediaType) {
                mMediaPickedByUserOnBlock = true;
                // image blocks do not respect the multiple selection flag, so we set the append as siblings flag instead
                mAppendsMultipleSelectedToSiblingBlocks = mediaType == MediaType.IMAGE && !allowMultipleSelection;
                mMediaSelectedCallback = mediaSelectedCallback;
                if (mediaType == MediaType.IMAGE) {
                    mOnMediaLibraryButtonListener.onUploadPhotoButtonClicked(true);
                } else if (mediaType == MediaType.VIDEO) {
                    mOnMediaLibraryButtonListener.onUploadVideoButtonClicked(allowMultipleSelection);
                } else if (mediaType == MediaType.MEDIA) {
                    mOnMediaLibraryButtonListener.onUploadMediaButtonClicked(allowMultipleSelection);
                }
            }

            @Override
            public void requestMediaPickerFromDeviceCamera(MediaSelectedCallback mediaSelectedCallback, MediaType mediaType) {
                mMediaPickedByUserOnBlock = true;
                mAppendsMultipleSelectedToSiblingBlocks = false;
                mMediaSelectedCallback = mediaSelectedCallback;
                if (mediaType == MediaType.IMAGE) {
                    mOnMediaLibraryButtonListener.onCapturePhotoButtonClicked();
                } else if (mediaType == MediaType.VIDEO) {
                    mOnMediaLibraryButtonListener.onCaptureVideoButtonClicked();
                }
            }

            @Override
            public void requestMediaImport(String url, MediaSelectedCallback mediaSelectedCallback) {
                // no op - we don't need to paste images on Android, but the method needs to exist
                // to match the iOS counterpart
            }

            @Override
            public void mediaUploadSync(MediaSelectedCallback mediaSelectedCallback) {
                mMediaSelectedCallback = mediaSelectedCallback;
                mOnReattachMediaUploadQueryListener.onQueryCurrentProgressForUploadingMedia();
            }

            @Override
            public void mediaSaveSync(MediaSelectedCallback mediaSelectedCallback) {
                mMediaSelectedCallback = mediaSelectedCallback;
                mOnReattachMediaSavingQueryListener.onQueryCurrentProgressForSavingMedia();
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
            public void setFeaturedImage(int mediaId) {
                mOnSetFeaturedImageListener.onSetFeaturedImageButtonClicked(mediaId);
            }

            @Override
            public void editorDidMount(ReadableArray unsupportedBlockNames) {
                mOnEditorMountListener.onEditorDidMount(unsupportedBlockNames.toArrayList());
                mDeferredEventEmitter.setEmitter(mRnReactNativeGutenbergBridgePackage
                        .getRNReactNativeGutenbergBridgeModule());
                mIsEditorMounted = true;
                if (TextUtils.isEmpty(mTitle) && TextUtils.isEmpty(mContentHtml)) {
                    setFocusOnTitle();
                    // send signal to Editor to create a new image block and pass the media URL, start uploading, etc
                    // use mMediaUrlToAddAfterMounting
                    dispatchOneMediaToAddAtATimeIfAvailable();
                }
                refreshEditorTheme();
            }

            @Override
            public void editorDidAutosave() {
                if (mOnEditorAutosaveListener != null) {
                    mOnEditorAutosaveListener.onEditorAutosave();
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

            @Override
            public void getOtherMediaPickerOptions(OtherMediaOptionsReceivedCallback otherMediaOptionsReceivedCallback,
                                                   MediaType mediaType) {
                switch (mediaType){
                    case IMAGE:
                    case MEDIA:
                        ArrayList<MediaOption> otherMediaImageOptions = mOnMediaLibraryButtonListener.onGetOtherMediaImageOptions();
                        otherMediaOptionsReceivedCallback.onOtherMediaOptionsReceived(otherMediaImageOptions);
                        break;
                    case ANY:
                        ArrayList<MediaOption> otherMediaFileOptions = mOnMediaLibraryButtonListener.onGetOtherMediaFileOptions();
                        otherMediaOptionsReceivedCallback.onOtherMediaOptionsReceived(otherMediaFileOptions);
                        break;
                    case AUDIO:
                        ArrayList<MediaOption> otherMediaAudioFileOptions = mOnMediaLibraryButtonListener.onGetOtherMediaAudioFileOptions();
                        otherMediaOptionsReceivedCallback.onOtherMediaOptionsReceived(otherMediaAudioFileOptions);
                        break;

                }
            }

            @Override
            public void requestMediaPickFrom(String mediaSource,
                                                       MediaSelectedCallback mediaSelectedCallback,
                                                       Boolean allowMultipleSelection) {
                mMediaSelectedCallback = mediaSelectedCallback;
                mMediaPickedByUserOnBlock = true;
                mAppendsMultipleSelectedToSiblingBlocks = false;
                mOnMediaLibraryButtonListener.onOtherMediaButtonClicked(mediaSource, allowMultipleSelection);
            }

            @Override
            public void performGetRequest(String pathFromJS, boolean enableCaching, Consumer<String> onSuccess, Consumer<Bundle> onError) {
                mRequestExecutor.performGetRequest(pathFromJS, enableCaching, onSuccess, onError);
            }

            @Override
            public void performPostRequest(String pathFromJS, ReadableMap data, Consumer<String> onSuccess, Consumer<Bundle> onError) {
                mRequestExecutor.performPostRequest(pathFromJS, data, onSuccess, onError);
            }

            @Override
            public void requestImageFullscreenPreview(String mediaUrl) {
                mOnImageFullscreenPreviewListener.onImageFullscreenPreviewClicked(mediaUrl);
            }

            @Override
            public void requestMediaEditor(MediaSelectedCallback mediaSelectedCallback, String mediaUrl) {
                mMediaPickedByUserOnBlock = true;
                mMediaSelectedCallback = mediaSelectedCallback;
                mOnMediaEditorListener.onMediaEditorClicked(mediaUrl);
            }

            @Override
            public void gutenbergDidRequestUnsupportedBlockFallback(ReplaceUnsupportedBlockCallback replaceUnsupportedBlockCallback,
                                                                    String content,
                                                                    String blockId,
                                                                    String blockName,
                                                                    String blockTitle) {
                mReplaceUnsupportedBlockCallback = replaceUnsupportedBlockCallback;
                mOnGutenbergDidRequestUnsupportedBlockFallbackListener.
                        gutenbergDidRequestUnsupportedBlockFallback(new UnsupportedBlock(blockId, blockName, blockTitle, content));
            }

            public void requestEmbedFullscreenPreview(String html, String title) {
                mOnGutenbergDidRequestEmbedFullscreenPreviewListener.
                        gutenbergDidRequestEmbedFullscreenPreview(html, title);
            }

            @Override
            public void gutenbergDidSendButtonPressedAction(String buttonType) {
                mOnGutenbergDidSendButtonPressedActionListener.gutenbergDidSendButtonPressedAction(buttonType);
            }

            @Override
            public void onShowUserSuggestions(Consumer<String> onResult) {
                mShowSuggestionsUtil.showUserSuggestions(onResult);
            }

            @Override public void onShowXpostSuggestions(Consumer<String> onResult) {
                mShowSuggestionsUtil.showXpostSuggestions(onResult);
            }

            @Override
            public void requestMediaFilesEditorLoad(ReadableArray mediaFiles, String blockId) {
                mOnMediaFilesCollectionBasedBlockEditorListener
                        .onRequestMediaFilesEditorLoad(mediaFiles.toArrayList(), blockId);
            }

            @Override
            public void requestMediaFilesFailedRetryDialog(ReadableArray mediaFiles) {
                mOnMediaFilesCollectionBasedBlockEditorListener.onRetryUploadForMediaCollection(
                        mediaFiles.toArrayList()
                );
            }

            @Override
            public void requestMediaFilesUploadCancelDialog(ReadableArray mediaFiles) {
                mOnMediaFilesCollectionBasedBlockEditorListener.onCancelUploadForMediaCollection(
                        mediaFiles.toArrayList()
                );
            }

            @Override
            public void requestMediaFilesSaveCancelDialog(ReadableArray mediaFiles) {
                mOnMediaFilesCollectionBasedBlockEditorListener.onCancelSaveForMediaCollection(
                        mediaFiles.toArrayList()
                );
            }

            @Override
            public void mediaFilesBlockReplaceSync(ReadableArray mediaFiles, String blockId) {
                mOnMediaFilesCollectionBasedBlockEditorListener.onMediaFilesBlockReplaceSync(
                    mediaFiles.toArrayList(), blockId
                );
            }

            @Override
            public void setFocalPointPickerTooltipShown(boolean showTooltip) {
                mOnFocalPointPickerTooltipShownListener.onSetFocalPointPickerTooltipShown(showTooltip);
            }

            @Override
            public void requestFocalPointPickerTooltipShown(FocalPointPickerTooltipShownCallback focalPointPickerTooltipShownCallback) {
                boolean tooltipShown = mOnFocalPointPickerTooltipShownListener.onRequestFocalPointPickerTooltipShown();
                focalPointPickerTooltipShownCallback.onRequestFocalPointPickerTooltipShown(tooltipShown);
            }

            @Override
            public void requestPreview() {
                mOnGutenbergDidRequestPreviewListener.gutenbergDidRequestPreview();
            }

            @Override
            public void requestBlockTypeImpressions(BlockTypeImpressionsCallback blockTypeImpressionsCallback) {
                // Double utilized to satisfy both React Native's expectations (https://bit.ly/3f3tsT4)
                // and Gson's deserialization which uses Double for all numbers (https://bit.ly/2VfpvUv)
                Map<String, Double> storedImpressions = mOnBlockTypeImpressionsEventListener.onRequestBlockTypeImpressions();
                WritableMap impressions = Arguments.createMap();
                for (Map.Entry<String, Double> entry: storedImpressions.entrySet()) {
                    impressions.putDouble(entry.getKey(), entry.getValue());
                }
                blockTypeImpressionsCallback.onRequestBlockTypeImpressions(impressions);
            }

            @Override
            public void setBlockTypeImpressions(ReadableMap newImpressions) {
                Map<String, Double> impressions = new HashMap<>();
                ReadableMapKeySetIterator iterator = newImpressions.keySetIterator();
                while (iterator.hasNextKey()) {
                    String key = iterator.nextKey();
                    impressions.put(key, newImpressions.getDouble(key));
                }
                mOnBlockTypeImpressionsEventListener.onSetBlockTypeImpressions(impressions);
            }

            @Override
            public void requestContactCustomerSupport() {
                mOnCustomerSupportOptionsListener.onContactCustomerSupport();
            }

            @Override
            public void requestGotoCustomerSupportOptions() {
                mOnCustomerSupportOptionsListener.onGotoCustomerSupportOptions();
            }

            @Override
            public void sendEventToHost(String eventName, ReadableMap properties) {
                mOnSendEventToHostListener.onSendEventToHost(eventName, properties.toHashMap());
            }

            @Override
            public void toggleUndoButton(boolean isDisabled) {
                mOnToggleUndoButtonListener.onToggleUndoButton(isDisabled);
            }

            @Override
            public void toggleRedoButton(boolean isDisabled) {
                mOnToggleRedoButtonListener.onToggleRedoButton(isDisabled);
            }

            @Override
            public void requestConnectionStatus(ConnectionStatusCallback connectionStatusCallback) {
                boolean isConnected = mOnConnectionStatusEventListener.onRequestConnectionStatus();
                connectionStatusCallback.onRequestConnectionStatus(isConnected);
            }
        }, mIsDarkMode);

        return Arrays.asList(
                new MainReactPackage(getMainPackageConfig(getImagePipelineConfig(sOkHttpClient))),
                new SvgPackage(),
                new LinearGradientPackage(),
                new ReactAztecPackage(mExceptionLogger, mBreadcrumbLogger),
                new ReactVideoPackage(),
                new ReactSliderPackage(),
                new RNGetRandomValuesPackage(),
                new RNGestureHandlerPackage(),
                new RNScreensPackage(),
                new SafeAreaContextPackage(),
                new RNCMaskedViewPackage(),
                new ReanimatedPackage() {
                    // Reanimated assumes that the app implements "ReactApplication" in order to get the React instance
                    // manager. Since this is not the case, as Gutenberg is integrated as a library, we have to override
                    // "getReactInstanceManager" in order to provide the proper instance.
                    @Override
                    public ReactInstanceManager getReactInstanceManager(ReactApplicationContext reactContext) {
                        return mReactInstanceManager;
                    }
                },
                new RNCWebViewPackage(),
                new ClipboardPackage(),
                new FastImageViewPackage(),
                mRnReactNativeGutenbergBridgePackage);
    }

    private MainPackageConfig getMainPackageConfig(ImagePipelineConfig imagePipelineConfig) {
        return new MainPackageConfig.Builder().setFrescoConfig(imagePipelineConfig).build();
    }

    private ImagePipelineConfig getImagePipelineConfig(OkHttpClient client) {
        return OkHttpImagePipelineConfigFactory
                .newBuilder(mReactRootView.getContext(), client).build();
    }

    public void onCreateView(Context initContext,
                             Application application,
                             boolean isDebug,
                             int colorBackground,
                             Consumer<Exception> exceptionLogger,
                             Consumer<String> breadcrumbLogger,
                             GutenbergProps gutenbergProps) {
        mIsDarkMode = gutenbergProps.isDarkMode();
        mExceptionLogger = exceptionLogger;
        mBreadcrumbLogger = breadcrumbLogger;
        mReactRootView = new ReactRootView(new MutableContextWrapper(initContext));
        mReactRootView.setBackgroundColor(colorBackground);

        // Workaround to prevent saving large RN view hierarchies that lead to a `TransactionTooLargeException`
        // Ref: https://github.com/wordpress-mobile/WordPress-Android/issues/9685#issuecomment-1908452392
        mReactRootView.setSaveFromParentEnabled(false);

        ReactInstanceManagerBuilder builder =
                ReactInstanceManager.builder()
                                    .setApplication(application)
                                    .setJSMainModulePath("index")
                                    .addPackages(getPackages())
                                    .setUseDeveloperSupport(isDebug)
                                    .setJavaScriptExecutorFactory(new HermesExecutorFactory())
                                    .setInitialLifecycleState(LifecycleState.BEFORE_CREATE);
        if (BuildConfig.SHOULD_ATTACH_JS_BUNDLE) {
            builder.setBundleAssetName("index.android.bundle");
        }
        mReactInstanceManager = builder.build();
        mReactInstanceManager.addReactInstanceEventListener(context -> {
            mReactContext = context;
        });

        Bundle initialProps = gutenbergProps.getInitialProps(mReactRootView.getAppProperties());
        mReactRootView.setAppProperties(initialProps);
    }

    public void attachToContainer(ViewGroup viewGroup,
                                  OnMediaLibraryButtonListener onMediaLibraryButtonListener,
                                  OnReattachMediaUploadQueryListener onReattachMediaUploadQueryListener,
                                  OnReattachMediaSavingQueryListener onReattachMediaSavingQueryListener,
                                  OnSetFeaturedImageListener onSetFeaturedImageListener,
                                  OnEditorMountListener onEditorMountListener,
                                  OnEditorAutosaveListener onEditorAutosaveListener,
                                  OnAuthHeaderRequestedListener onAuthHeaderRequestedListener,
                                  RequestExecutor fetchExecutor,
                                  OnImageFullscreenPreviewListener onImageFullscreenPreviewListener,
                                  OnMediaEditorListener onMediaEditorListener,
                                  OnGutenbergDidRequestUnsupportedBlockFallbackListener onGutenbergDidRequestUnsupportedBlockFallbackListener,
                                  OnGutenbergDidRequestEmbedFullscreenPreviewListener onGutenbergDidRequestEmbedFullscreenPreviewListener,
                                  OnGutenbergDidSendButtonPressedActionListener onGutenbergDidSendButtonPressedActionListener,
                                  ShowSuggestionsUtil showSuggestionsUtil,
                                  OnMediaFilesCollectionBasedBlockEditorListener onMediaFilesCollectionBasedBlockEditorListener,
                                  OnFocalPointPickerTooltipShownEventListener onFocalPointPickerTooltipListener,
                                  OnGutenbergDidRequestPreviewListener onGutenbergDidRequestPreviewListener,
                                  OnBlockTypeImpressionsEventListener onBlockTypeImpressionsEventListener,
                                  OnCustomerSupportOptionsListener onCustomerSupportOptionsListener,
                                  OnSendEventToHostListener onSendEventToHostListener,
                                  OnToggleUndoButtonListener onToggleUndoButtonListener,
                                  OnToggleRedoButtonListener onToggleRedoButtonListener,
                                  OnConnectionStatusEventListener onConnectionStatusEventListener,
                                  OnBackHandlerEventListener onBackHandlerEventListener,
                                  boolean isDarkMode) {
        MutableContextWrapper contextWrapper = (MutableContextWrapper) mReactRootView.getContext();
        contextWrapper.setBaseContext(viewGroup.getContext());

        mOnMediaLibraryButtonListener = onMediaLibraryButtonListener;
        mOnReattachMediaUploadQueryListener = onReattachMediaUploadQueryListener;
        mOnReattachMediaSavingQueryListener = onReattachMediaSavingQueryListener;
        mOnSetFeaturedImageListener = onSetFeaturedImageListener;
        mOnEditorMountListener = onEditorMountListener;
        mOnEditorAutosaveListener = onEditorAutosaveListener;
        mRequestExecutor = fetchExecutor;
        mOnImageFullscreenPreviewListener = onImageFullscreenPreviewListener;
        mOnMediaEditorListener = onMediaEditorListener;
        mOnGutenbergDidRequestUnsupportedBlockFallbackListener = onGutenbergDidRequestUnsupportedBlockFallbackListener;
        mOnGutenbergDidRequestEmbedFullscreenPreviewListener = onGutenbergDidRequestEmbedFullscreenPreviewListener;
        mOnGutenbergDidSendButtonPressedActionListener = onGutenbergDidSendButtonPressedActionListener;
        mShowSuggestionsUtil = showSuggestionsUtil;
        mOnMediaFilesCollectionBasedBlockEditorListener = onMediaFilesCollectionBasedBlockEditorListener;
        mOnFocalPointPickerTooltipShownListener = onFocalPointPickerTooltipListener;
        mOnGutenbergDidRequestPreviewListener = onGutenbergDidRequestPreviewListener;
        mOnBlockTypeImpressionsEventListener = onBlockTypeImpressionsEventListener;
        mOnCustomerSupportOptionsListener = onCustomerSupportOptionsListener;
        mOnSendEventToHostListener = onSendEventToHostListener;
        mOnToggleUndoButtonListener = onToggleUndoButtonListener;
        mOnToggleRedoButtonListener = onToggleRedoButtonListener;
        mOnConnectionStatusEventListener = onConnectionStatusEventListener;
        mOnBackHandlerEventListener = onBackHandlerEventListener;

        sAddCookiesInterceptor.setOnAuthHeaderRequestedListener(onAuthHeaderRequestedListener);

        if (mReactRootView.getParent() != null) {
            ((ViewGroup) mReactRootView.getParent()).removeView(mReactRootView);
        }

        viewGroup.addView(mReactRootView, 0,
                new LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        if (hasReactContext()) {
            setPreferredColorScheme(isDarkMode);
        }

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
        mShouldHandleBackPress = false;
        if (mReactInstanceManager != null) {
            // get the focused view so we re-focus it later if needed. WeakReference so we don't leak it.
            mLastFocusedView = new WeakReference<>(mReactRootView.findFocus());

            mReactInstanceManager.onHostPause(activity);
        }
    }

    public void onResume(final Fragment fragment, final Activity activity) {
        mShouldHandleBackPress = true;
        if (mReactInstanceManager != null) {
            mReactInstanceManager.onHostResume(activity,
                    new DefaultHardwareBackBtnHandler() {
                        @Override
                        public void invokeDefaultOnBackPressed() {
                            if (fragment.isAdded()) {
                                mOnBackHandlerEventListener.onBackHandler();
                            }
                        }
                    });
        }
    }

    public void onDetach(Activity activity) {
        mShouldHandleBackPress = false;
        mReactInstanceManager.onHostDestroy(activity);
        mRnReactNativeGutenbergBridgePackage.getRNReactNativeGutenbergBridgeModule().notifyModalClosed();
    }

    public void onDestroy(Activity activity) {
        mShouldHandleBackPress = false;
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

    public void onBackPressed() {
        if (mReactInstanceManager != null) {
            mReactInstanceManager.onBackPressed();
        }
    }

    public void showDevOptionsDialog() {
        mReactInstanceManager.showDevOptionsDialog();
    }

    public void setFocusOnTitle() {
        mRnReactNativeGutenbergBridgePackage.getRNReactNativeGutenbergBridgeModule().setFocusOnTitleInJS();
    }

    public void appendNewMediaBlock(int mediaId, String mediaUri, String mediaType) {
        mRnReactNativeGutenbergBridgePackage.getRNReactNativeGutenbergBridgeModule()
                                            .appendNewMediaBlock(mediaId, mediaUri, mediaType);
    }

    public void setPreferredColorScheme(boolean isDarkMode) {
        if (mIsDarkMode != isDarkMode) {
            mIsDarkMode = isDarkMode;
            mRnReactNativeGutenbergBridgePackage.getRNReactNativeGutenbergBridgeModule()
                                                .setPreferredColorScheme(isDarkMode);
        }
    }

    public void updateTheme(@Nullable Bundle editorTheme) {
        if (mIsEditorMounted) {
            mRnReactNativeGutenbergBridgePackage.getRNReactNativeGutenbergBridgeModule()
                                                .updateTheme(editorTheme);
        } else {
            // Editor hasn't mounted yet. Save theme and load once editor loads
            AppLog.d(AppLog.T.EDITOR, "Editor theme not applied reason: Editor not mounted");
            mEditorTheme = editorTheme;
        }
    }

    private void refreshEditorTheme() {
        if (mEditorTheme != null) {
            mRnReactNativeGutenbergBridgePackage.getRNReactNativeGutenbergBridgeModule()
                                                .updateTheme(mEditorTheme);
            mEditorTheme = null;
        }
    }

    public void showNotice(String message) {
        if (message != null) {
            mRnReactNativeGutenbergBridgePackage.getRNReactNativeGutenbergBridgeModule().showNoticeInJS(message);
        } else {
            AppLog.d(AppLog.T.EDITOR, "Notice not shown because message is null");
        }
    }

    public void showEditorHelp() {
        mRnReactNativeGutenbergBridgePackage.getRNReactNativeGutenbergBridgeModule().showEditorHelp();
    }

    public void onUndoPressed() {
        mRnReactNativeGutenbergBridgePackage.getRNReactNativeGutenbergBridgeModule().onUndoPressed();
    }

    public void onRedoPressed() {
        mRnReactNativeGutenbergBridgePackage.getRNReactNativeGutenbergBridgeModule().onRedoPressed();
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
        if (content != null) {
            mContentHtml = content;
        }
        if (title != null) {
            mTitle = title;
        }

        Bundle appProps = GutenbergProps.Companion.initContent(mReactRootView.getAppProperties(), title, content);
        mReactRootView.startReactApplication(mReactInstanceManager, "gutenberg", appProps);
    }

    private void updateContent(String title, String content) {
        if (content != null) {
            mContentHtml = content;
        }
        if (title != null) {
            mTitle = title;
        }
        if (hasReactContext()) {
            if (content != null) {
                mRnReactNativeGutenbergBridgePackage.getRNReactNativeGutenbergBridgeModule().setHtmlInJS(content);
            }
            if (title != null) {
                mRnReactNativeGutenbergBridgePackage.getRNReactNativeGutenbergBridgeModule().setTitleInJS(title);
            }
        }
    }

    public interface OnGetContentInterrupted {
        void onGetContentInterrupted(InterruptedException ie);
    }

    public synchronized CharSequence getContent(CharSequence originalContent,
                                                OnGetContentInterrupted onGetContentInterrupted) {
        if (hasReactContext()) {
            mGetContentCountDownLatch = new CountDownLatch(1);

            mRnReactNativeGutenbergBridgePackage.getRNReactNativeGutenbergBridgeModule().getHtmlFromJS();

            try {
                boolean success = mGetContentCountDownLatch.await(10, TimeUnit.SECONDS);
                if (!success) {
                    AppLog.e(T.EDITOR, "Timeout reached before response from requestGetHtml.");
                }
            } catch (InterruptedException ie) {
                onGetContentInterrupted.onGetContentInterrupted(ie);
            }

            return mContentChanged ? (mContentHtml == null ? "" : mContentHtml) : originalContent;
        } else {
            AppLog.e(T.EDITOR, "getContent was called when there was no React context.");
        }

        return originalContent;
    }

    /** This method retrieves both the title and the content from the Gutenberg editor by the emission of a single
     * event. This is useful to avoid redundant events, since {@link #getContent} already retrieves the title as well,
     * using same event, and also shares the same mechanism to suspend execution until a response is received (or a
     * timeout is reached).
     * @param originalContent fallback content to return in case the timeout is reached, or the thread is interrupted
     * @param onGetContentInterrupted callback to invoke if thread is interrupted before the timeout
     * @return A Pair of CharSequence with the first being the title and the second being the content
     */
    public synchronized Pair<CharSequence, CharSequence> getTitleAndContent(CharSequence originalContent,
                                                               OnGetContentInterrupted onGetContentInterrupted) {
        if (hasReactContext()) {
            mGetContentCountDownLatch = new CountDownLatch(1);

            mRnReactNativeGutenbergBridgePackage.getRNReactNativeGutenbergBridgeModule().getHtmlFromJS();

            try {
                boolean success = mGetContentCountDownLatch.await(10, TimeUnit.SECONDS);
                if (!success) {
                    AppLog.e(T.EDITOR, "Timeout reached before response from requestGetHtml.");
                }
            } catch (InterruptedException ie) {
                onGetContentInterrupted.onGetContentInterrupted(ie);
            }

            return new Pair<>(
                    mTitle == null ? "" : mTitle,
                    mContentChanged ? (mContentHtml == null ? "" : mContentHtml) : originalContent
            );
        } else {
            AppLog.e(T.EDITOR, "getTitleAndContent was called when there was no React context.");
        }

        return new Pair<>("", originalContent);
    }

    public boolean triggerGetContentInfo(OnContentInfoReceivedListener onContentInfoReceivedListener) {
        if (hasReactContext() && (mGetContentCountDownLatch == null || mGetContentCountDownLatch.getCount() == 0)) {
            if (!mIsEditorMounted) {
                onContentInfoReceivedListener.onEditorNotReady();
                return false;
            }
            new Thread(new Runnable() {
                @Override public void run() {
                    // We need to synchronize access to (and overwriting of) the latch to avoid race conditions
                    synchronized (WPAndroidGlueCode.this) {
                        mGetContentCountDownLatch = new CountDownLatch(1);

                        mRnReactNativeGutenbergBridgePackage.getRNReactNativeGutenbergBridgeModule().getHtmlFromJS();

                        try {
                            boolean success = mGetContentCountDownLatch.await(5, TimeUnit.SECONDS);
                            if (!success) {
                                AppLog.e(T.EDITOR, "Timeout reached before response from requestGetHtml.");
                            }
                            if (mContentInfo == null) {
                                onContentInfoReceivedListener.onContentInfoFailed();
                            } else {
                                onContentInfoReceivedListener.onContentInfoReceived(mContentInfo.toHashMap());
                            }
                        } catch (InterruptedException ie) {
                            onContentInfoReceivedListener.onContentInfoFailed();
                        }
                    }
                }
            }).start();

            return true;
        }

        return false;
    }

    private String getMediaType(final boolean isVideo) {
        return isVideo ? "video" : "image";
    }

    public void toggleEditorMode(boolean htmlModeEnabled) {
        // Turn off hardware acceleration for Oreo
        // see https://github.com/wordpress-mobile/gutenberg-mobile/issues/1268#issuecomment-535887390
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                && Build.VERSION.SDK_INT <= Build.VERSION_CODES.O_MR1) {
            if (htmlModeEnabled) {
                mReactRootView.setLayerType(View.LAYER_TYPE_SOFTWARE, null);
            } else {
                mReactRootView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
            }
        }
        mRnReactNativeGutenbergBridgePackage.getRNReactNativeGutenbergBridgeModule().toggleEditorMode();
    }

    public void sendToJSPostSaveEvent() {
        mRnReactNativeGutenbergBridgePackage.getRNReactNativeGutenbergBridgeModule().sendToJSPostSaveEvent();
    }

    public void appendMediaFiles(ArrayList<Media> mediaList) {
        if (isMediaSelectedCallbackRegistered() && mMediaPickedByUserOnBlock) {
            mMediaPickedByUserOnBlock = false;
            List<RNMedia> rnMediaList = new ArrayList<>();

            // We have special handling here for the image block when the user selects multiple items from the
            // WordPress Media Library: We pass the first image to the callback, and the remaining images will be
            // appended as blocks via sendOrDeferAppendMediaSignal
            //
            // All other media selection results should be passed to the callback at once (as a collection)
            //
            // Note: In the future, after image block <-> gallery block transforms have been implemented, this special
            // handling will no longer be necessary

            if (mAppendsMultipleSelectedToSiblingBlocks && 1 < mediaList.size()) {
                rnMediaList.add(mediaList.get(0));
                mMediaSelectedCallback.onMediaFileSelected(rnMediaList);

                for (Media mediaToAppend : mediaList.subList(1, mediaList.size())) {
                    sendOrDeferAppendMediaSignal(mediaToAppend);
                }
            } else {
                rnMediaList.addAll(mediaList);
                mMediaSelectedCallback.onMediaFileSelected(rnMediaList);
            }
        } else {
            // This case is for media that is shared from the device
            for (Media mediaToAppend : mediaList) {
                sendOrDeferAppendMediaSignal(mediaToAppend);
            }
        }

        mAppendsMultipleSelectedToSiblingBlocks = false;
    }

    private void sendOrDeferAppendMediaSignal(Media media) {
        // if editor is mounted, let's append the media file
        if (mIsEditorMounted) {
            if (!TextUtils.isEmpty(media.getUrl()) && media.getId() > 0) {
                // send signal to JS
                appendNewMediaBlock(media.getId(), media.getUrl(), media.getType());
            }
        } else {
            // save the URL, we'll add it once Editor is mounted
            synchronized (WPAndroidGlueCode.this) {
                mMediaToAddAfterMounting.put(media.getId(), media);
            }
        }
    }

    private synchronized void dispatchOneMediaToAddAtATimeIfAvailable() {
        Iterator<Entry<Integer, Media>> iter = mMediaToAddAfterMounting.entrySet().iterator();
        while (iter.hasNext()) {
            Map.Entry<Integer, Media> entry = iter.next();
            Integer mediaId = entry.getKey();
            Media media = entry.getValue();
            if (!TextUtils.isEmpty(media.getUrl()) && mediaId > 0) {
                // send signal to JS
                appendNewMediaBlock(mediaId, media.getUrl(), media.getType());
                iter.remove();
            }
        }
    }

    public void mediaFileUploadProgress(final int mediaId, final float progress) {
        mDeferredEventEmitter.onMediaFileUploadProgress(mediaId, progress);
    }

    public void mediaFileUploadFailed(final int mediaId) {
        mDeferredEventEmitter.onMediaFileUploadFailed(mediaId);
    }

    public void mediaFileUploadPaused(final int mediaId) {
        mDeferredEventEmitter.onMediaFileUploadPaused(mediaId);
    }

    public void mediaFileUploadSucceeded(final int mediaId, final String mediaUrl, final int serverMediaId, final
                                         WritableNativeMap metadata) {
        mDeferredEventEmitter.onMediaFileUploadSucceeded(mediaId, mediaUrl, serverMediaId, metadata);
    }

    public void clearMediaFileURL(final int mediaId) {
        mDeferredEventEmitter.onUploadMediaFileClear(mediaId);
    }

    public void clearFileSaveStatus(final String mediaId) {
        mDeferredEventEmitter.onSaveMediaFileClear(mediaId);
    }

    public void mediaFileSaveProgress(final String mediaId, final float progress) {
        mDeferredEventEmitter.onMediaFileSaveProgress(mediaId, progress);
    }

    public void mediaFileSaveFailed(final String mediaId) {
        mDeferredEventEmitter.onMediaFileSaveFailed(mediaId);
    }

    public void mediaFileSaveSucceeded(final String mediaId, final String mediaUrl) {
        mDeferredEventEmitter.onMediaFileSaveSucceeded(mediaId, mediaUrl);
    }

    public void mediaCollectionFinalSaveResult(final String blockFirstMediaId, final boolean success) {
        mDeferredEventEmitter.onMediaCollectionSaveResult(blockFirstMediaId, success);
    }

    public void mediaIdChanged(final String oldId, final String newId, final String oldUrl) {
        mDeferredEventEmitter.onMediaIdChanged(oldId, newId, oldUrl);
    }

    public void sendToJSFeaturedImageId(int mediaId) {
        mDeferredEventEmitter.sendToJSFeaturedImageId(mediaId);
    }

    public void connectionStatusChange(boolean isConnected) {
        mDeferredEventEmitter.onConnectionStatusChange(isConnected);
    }

    public void replaceUnsupportedBlock(String content, String blockId) {
        if (mReplaceUnsupportedBlockCallback != null) {
            mReplaceUnsupportedBlockCallback.replaceUnsupportedBlock(content, blockId);
            mReplaceUnsupportedBlockCallback = null;
        }
    }

    public void replaceMediaFilesEditedBlock(final String mediaFiles, final String blockId) {
        mDeferredEventEmitter.onReplaceMediaFilesEditedBlock(mediaFiles, blockId);
    }

    private boolean isMediaSelectedCallbackRegistered() {
        return mMediaSelectedCallback != null;
    }

    public void updateCapabilities(GutenbergProps gutenbergProps) {
        mDeferredEventEmitter.updateCapabilities(gutenbergProps);
    }
}
