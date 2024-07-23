package com.gutenberg

import android.app.Application
import android.content.Intent
import android.content.res.Configuration
import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.core.util.Consumer
import com.BV.LinearGradient.LinearGradientPackage
import com.brentvatne.react.ReactVideoPackage
import com.dylanvann.fastimage.FastImageViewPackage
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.PackageList
import com.facebook.react.ReactHost
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.flipper.ReactNativeFlipper
import com.facebook.soloader.SoLoader
import com.horcrux.svg.SvgPackage
import com.reactnativecommunity.clipboard.ClipboardPackage
import com.reactnativecommunity.slider.ReactSliderPackage
import com.reactnativecommunity.webview.RNCWebViewPackage
import com.swmansion.gesturehandler.RNGestureHandlerPackage
import com.swmansion.reanimated.ReanimatedPackage
import com.swmansion.rnscreens.RNScreensPackage
import com.th3rdwave.safeareacontext.SafeAreaContextPackage
import org.linusu.RNGetRandomValuesPackage
import org.reactnative.maskedview.RNCMaskedViewPackage
import org.wordpress.mobile.ReactNativeAztec.ReactAztecPackage
import org.wordpress.mobile.ReactNativeGutenbergBridge.GutenbergBridgeInterface
import org.wordpress.mobile.ReactNativeGutenbergBridge.GutenbergBridgeJS2Parent
import org.wordpress.mobile.ReactNativeGutenbergBridge.GutenbergBridgeJS2Parent.BlockTypeImpressionsCallback
import org.wordpress.mobile.ReactNativeGutenbergBridge.GutenbergBridgeJS2Parent.ConnectionStatusCallback
import org.wordpress.mobile.ReactNativeGutenbergBridge.GutenbergBridgeJS2Parent.FocalPointPickerTooltipShownCallback
import org.wordpress.mobile.ReactNativeGutenbergBridge.GutenbergBridgeJS2Parent.MediaSelectedCallback
import org.wordpress.mobile.ReactNativeGutenbergBridge.GutenbergBridgeJS2Parent.OtherMediaOptionsReceivedCallback
import org.wordpress.mobile.ReactNativeGutenbergBridge.GutenbergBridgeJS2Parent.ReplaceUnsupportedBlockCallback
import org.wordpress.mobile.ReactNativeGutenbergBridge.GutenbergWebViewActivity
import org.wordpress.mobile.ReactNativeGutenbergBridge.RNMedia
import org.wordpress.mobile.ReactNativeGutenbergBridge.RNReactNativeGutenbergBridgePackage
import org.wordpress.mobile.WPAndroidGlue.GutenbergJsException
import org.wordpress.mobile.WPAndroidGlue.Media
import org.wordpress.mobile.WPAndroidGlue.MediaOption

class MainApplication : Application(), ReactApplication, GutenbergBridgeInterface {
    private var mRnReactNativeGutenbergBridgePackage: RNReactNativeGutenbergBridgePackage? = null
    private var mReplaceUnsupportedBlockCallback: ReplaceUnsupportedBlockCallback? = null

    override val reactNativeHost: ReactNativeHost =
        object : DefaultReactNativeHost(this) {
            override fun getPackages(): List<ReactPackage> =
                PackageList(this).packages.apply {
                    add(ReactSliderPackage())
                    add(ReactVideoPackage())
                    add(SvgPackage()) // passing null because we do not need log handlers in the demo ap)p
                    add(ReactAztecPackage(null, null))
                    add(LinearGradientPackage())
                    add(RNGetRandomValuesPackage())
                    add(RNCMaskedViewPackage())
                    add(RNGestureHandlerPackage())
                    add(ReanimatedPackage())
                    add(SafeAreaContextPackage())
                    add(RNScreensPackage())
                    add(RNCWebViewPackage())
                    add(ClipboardPackage())
                    add(FastImageViewPackage())
                    add(mRnReactNativeGutenbergBridgePackage)
                }

            override fun getJSMainModuleName(): String {
                return "index"
            }

            override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

            override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
            override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
        }

    private fun initializeGutenbergBridge() {
        mRnReactNativeGutenbergBridgePackage = RNReactNativeGutenbergBridgePackage(object : GutenbergBridgeJS2Parent {
            override fun responseHtml(title: String, html: String, changed: Boolean, contentInfo: ReadableMap) {}
            override fun requestMediaImport(url: String, mediaSelectedCallback: MediaSelectedCallback) {}
            override fun requestMediaPickerFromDeviceCamera(mediaSelectedCallback: MediaSelectedCallback, mediaType: GutenbergBridgeJS2Parent.MediaType) {}
            override fun requestMediaPickFromDeviceLibrary(mediaSelectedCallback: MediaSelectedCallback, allowMultipleSelection: Boolean, mediaType: GutenbergBridgeJS2Parent.MediaType) {}
            override fun requestMediaPickFromMediaLibrary(mediaSelectedCallback: MediaSelectedCallback, allowMultipleSelection: Boolean, mediaType: GutenbergBridgeJS2Parent.MediaType) {
                val rnMediaList: MutableList<RNMedia> = ArrayList()
                val emptyMetadata = WritableNativeMap()
                when (mediaType) {
                    GutenbergBridgeJS2Parent.MediaType.IMAGE -> {
                        val image = Media(1, "https://cldup.com/cXyG__fTLN.jpg", "image", "Mountain", "", "A snow-capped mountain top in a cloudy sky with red-leafed trees in the foreground", emptyMetadata)
                        rnMediaList.add(image)
                    }

                    GutenbergBridgeJS2Parent.MediaType.VIDEO -> {
                        val metadata = WritableNativeMap()
                        metadata.putString("extraID", "AbCdE")
                        val video = Media(2, "https://i.cloudup.com/YtZFJbuQCE.mov", "video", "Cloudup", "", "", metadata)
                        rnMediaList.add(video)
                    }

                    GutenbergBridgeJS2Parent.MediaType.ANY, GutenbergBridgeJS2Parent.MediaType.OTHER -> {
                        val other = Media(3, "https://wordpress.org/latest.zip", "zip", "WordPress latest version", "WordPress.zip", "", emptyMetadata)
                        rnMediaList.add(other)
                    }

                    GutenbergBridgeJS2Parent.MediaType.AUDIO -> {
                        val audio = Media(5, "https://cldup.com/59IrU0WJtq.mp3", "audio", "Summer presto", "", "", emptyMetadata)
                        rnMediaList.add(audio)
                    }

                    else -> {}
                }
                mediaSelectedCallback.onMediaFileSelected(rnMediaList)
            }

            override fun mediaUploadSync(mediaSelectedCallback: MediaSelectedCallback) {}
            override fun requestImageFailedRetryDialog(mediaId: Int) {}
            override fun requestImageUploadCancelDialog(mediaId: Int) {}
            override fun requestImageUploadCancel(mediaId: Int) {}
            override fun setFeaturedImage(mediaId: Int) {}
            override fun editorDidMount(unsupportedBlockNames: ReadableArray) {}
            override fun editorDidAutosave() {}
            override fun getOtherMediaPickerOptions(otherMediaOptionsReceivedCallback: OtherMediaOptionsReceivedCallback, mediaType: GutenbergBridgeJS2Parent.MediaType) {
                if (mediaType == GutenbergBridgeJS2Parent.MediaType.ANY) {
                    val mediaOptions = ArrayList<MediaOption>()
                    mediaOptions.add(MediaOption("1", "Choose from device"))
                    otherMediaOptionsReceivedCallback.onOtherMediaOptionsReceived(mediaOptions)
                }
            }

            override fun requestMediaPickFrom(mediaSource: String, mediaSelectedCallback: MediaSelectedCallback, allowMultipleSelection: Boolean) {
                if (mediaSource == "1") {
                    val rnMediaList: MutableList<RNMedia> = ArrayList()
                    val pdf = Media(1, "https://grad.illinois.edu/sites/default/files/pdfs/cvsamples.pdf", "other", "", "cvsamples.pdf", "", WritableNativeMap())
                    rnMediaList.add(pdf)
                    mediaSelectedCallback.onMediaFileSelected(rnMediaList)
                }
            }

            override fun requestImageFullscreenPreview(mediaUrl: String) {}
            override fun requestEmbedFullscreenPreview(content: String, title: String) {}
            override fun requestMediaEditor(mediaSelectedCallback: MediaSelectedCallback, mediaUrl: String) {}
            override fun setFocalPointPickerTooltipShown(tooltipShown: Boolean) {}
            override fun requestFocalPointPickerTooltipShown(focalPointPickerTooltipShownCallback: FocalPointPickerTooltipShownCallback) {
                focalPointPickerTooltipShownCallback.onRequestFocalPointPickerTooltipShown(false)
            }

            override fun editorDidEmitLog(message: String, logLevel: GutenbergBridgeJS2Parent.LogLevel) {
                when (logLevel) {
                    GutenbergBridgeJS2Parent.LogLevel.TRACE -> Log.d(TAG, message)
                    GutenbergBridgeJS2Parent.LogLevel.INFO -> Log.i(TAG, message)
                    GutenbergBridgeJS2Parent.LogLevel.WARN -> Log.w(TAG, message)
                    GutenbergBridgeJS2Parent.LogLevel.ERROR -> Log.e(TAG, message)
                }
            }

            override fun performGetRequest(path: String, enableCaching: Boolean, onSuccess: Consumer<String>, onError: Consumer<Bundle>) {}
            override fun performPostRequest(path: String, data: ReadableMap, onSuccess: Consumer<String>, onError: Consumer<Bundle>) {}
            override fun gutenbergDidRequestUnsupportedBlockFallback(replaceUnsupportedBlockCallback: ReplaceUnsupportedBlockCallback,
                                                                     content: String,
                                                                     blockId: String,
                                                                     blockName: String,
                                                                     blockTitle: String) {
                mReplaceUnsupportedBlockCallback = replaceUnsupportedBlockCallback
                openGutenbergWebView(content, blockId, blockTitle)
            }

            override fun onShowUserSuggestions(onResult: Consumer<String>) {
                onResult.accept("matt")
            }

            override fun onShowXpostSuggestions(onResult: Consumer<String>) {
                onResult.accept("ma.tt")
            }

            override fun gutenbergDidSendButtonPressedAction(buttonType: String) {}
            override fun requestPreview() {
                Toast.makeText(this@MainApplication, "requestPreview called", Toast.LENGTH_SHORT).show()
            }

            override fun requestBlockTypeImpressions(blockTypeImpressionsCallback: BlockTypeImpressionsCallback) {
                val impressions: ReadableMap = Arguments.createMap()
                blockTypeImpressionsCallback.onRequestBlockTypeImpressions(impressions)
            }

            override fun setBlockTypeImpressions(impressions: ReadableMap) {
                Log.d("BlockTypeImpressions", String.format("Gutenberg requested setting block type impression to %s.", impressions))
            }

            override fun requestContactCustomerSupport() {
                Toast.makeText(this@MainApplication, "requestContactCustomerSupport called", Toast.LENGTH_SHORT).show()
            }

            override fun requestGotoCustomerSupportOptions() {
                Toast.makeText(this@MainApplication, "requestGotoCustomerSupportOptions called", Toast.LENGTH_SHORT).show()
            }

            override fun sendEventToHost(eventName: String, properties: ReadableMap) {
                Log.d("SendEventToHost", String.format("Gutenberg requested sending '%s' event to host with properties: %s", eventName, properties))
            }

            override fun toggleUndoButton(isDisabled: Boolean) {
                MainActivity.instance?.updateUndoItem(isDisabled)
            }

            override fun toggleRedoButton(isDisabled: Boolean) {
                MainActivity.instance?.updateRedoItem(isDisabled)
            }

            override fun requestConnectionStatus(connectionStatusCallback: ConnectionStatusCallback) {
                connectionStatusCallback.onRequestConnectionStatus(true)
            }

            override fun logException(exception: GutenbergJsException, logExceptionCallback: GutenbergBridgeJS2Parent.LogExceptionCallback) {}
        }, isDarkMode)
    }

    private val isDarkMode: Boolean
        get() {
            val configuration = resources.configuration
            val currentNightMode = configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK
            return currentNightMode == Configuration.UI_MODE_NIGHT_YES
        }

    fun toggleUndo() {
        mRnReactNativeGutenbergBridgePackage!!.rnReactNativeGutenbergBridgeModule.onUndoPressed()
    }

    fun toggleRedo() {
        mRnReactNativeGutenbergBridgePackage!!.rnReactNativeGutenbergBridgeModule.onRedoPressed()
    }

    private fun openGutenbergWebView(content: String,
                                     blockId: String,
                                     blockName: String) {
        val intent = Intent(this, GutenbergWebViewActivity::class.java)
        intent.putExtra(GutenbergWebViewActivity.ARG_BLOCK_CONTENT, content)
        intent.putExtra(GutenbergWebViewActivity.ARG_BLOCK_ID, blockId)
        intent.putExtra(GutenbergWebViewActivity.ARG_BLOCK_NAME, blockName)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        startActivity(intent)
    }

    override val reactHost: ReactHost
        get() = DefaultReactHost.getDefaultReactHost(this.applicationContext, reactNativeHost)

    override fun onCreate() {
        super.onCreate()
        SoLoader.init(this,  /* native exopackage */false)

        initializeGutenbergBridge()

        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            // If you opted-in for the New Architecture, we load the native entry point for this app.
            load()
        }
        ReactNativeFlipper.initializeFlipper(this, reactNativeHost.reactInstanceManager)
        createCustomDevOptions(reactNativeHost)
    }

    private fun createCustomDevOptions(reactNativeHost: ReactNativeHost?) {
        val devSupportManager = reactNativeHost!!.reactInstanceManager.devSupportManager
        devSupportManager.addCustomDevOption("Show html") { mRnReactNativeGutenbergBridgePackage!!.rnReactNativeGutenbergBridgeModule.toggleEditorMode() }
        devSupportManager.addCustomDevOption("Help") { mRnReactNativeGutenbergBridgePackage!!.rnReactNativeGutenbergBridgeModule.showEditorHelp() }
    }

    override fun saveContent(content: String, blockId: String) {
        if (mReplaceUnsupportedBlockCallback != null) {
            mReplaceUnsupportedBlockCallback!!.replaceUnsupportedBlock(content, blockId)
        }
    }

    companion object {
        private const val TAG = "MainApplication"
    }
}
