package com.gutenberg

import android.os.Bundle
import android.util.Log
import android.view.Menu
import android.view.MenuItem
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import androidx.appcompat.widget.Toolbar
import androidx.core.content.ContextCompat
import com.facebook.react.ReactActivity
import com.facebook.react.ReactRootView
import org.json.JSONException
import org.json.JSONObject
import org.wordpress.mobile.WPAndroidGlue.GutenbergProps
import java.util.Locale

class MainActivity : ReactActivity() {
    private var mReactRootView: ReactRootView? = null
    private var mMenu: Menu? = null
    private fun openReactNativeDebugMenu() {
        val devSettingsModule = reactInstanceManager
        devSettingsModule?.showDevOptionsDialog()
    }

    override fun onCreateOptionsMenu(menu: Menu): Boolean {
        mMenu = menu
        menuInflater.inflate(R.menu.toolbar_menu, menu)

        // Set opacity for menu items
        val undoItem = menu.findItem(R.id.menuUndo)
        undoItem.icon!!.alpha = 76
        undoItem.setEnabled(false)
        val redoItem = menu.findItem(R.id.menuRedo)
        redoItem.icon!!.alpha = 76
        redoItem.setEnabled(false)
        return true
    }

    fun updateUndoItem(isDisabled: Boolean) {
        if (mMenu != null) {
            runOnUiThread {
                val undoItem = mMenu!!.findItem(R.id.menuUndo)
                undoItem.setEnabled(!isDisabled)
                undoItem.icon!!.alpha = if (!isDisabled) 255 else 76
            }
        }
    }

    fun updateRedoItem(isDisabled: Boolean) {
        if (mMenu != null) {
            runOnUiThread {
                val redoItem = mMenu!!.findItem(R.id.menuRedo)
                redoItem.setEnabled(!isDisabled)
                redoItem.icon!!.alpha = if (!isDisabled) 255 else 76
            }
        }
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        val mainApplication = application as MainApplication
        val itemId = item.itemId
        if (itemId == R.id.menuUndo) {
            mainApplication.toggleUndo()
            return true
        }
        if (itemId == R.id.menuRedo) {
            mainApplication.toggleRedo()
            return true
        }
        if (itemId == R.id.menuButton) {
            openReactNativeDebugMenu()
            return true
        }
        return super.onOptionsItemSelected(item)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        instance = this

        // Create a LinearLayout that will hold both the toolbar and React Native content
        val linearLayout = LinearLayout(this)
        linearLayout.orientation = LinearLayout.VERTICAL
        linearLayout.layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
        linearLayout.isFocusable = false
        linearLayout.isFocusableInTouchMode = true

        // Create a Toolbar instance
        val toolbar = Toolbar(this)

        // Set toolbar properties (you can customize this as you want)
        toolbar.layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)

        // Set the toolbar as the Activity's action bar
        setSupportActionBar(toolbar)

        // Add the toolbar to the linear layout
        linearLayout.addView(toolbar)

        // Create a View to be used as the border
        val borderView = View(this)
        borderView.layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 1)
        borderView.setBackgroundColor(ContextCompat.getColor(this, R.color.toolbarBorder))

        // Add the border view to the linear layout
        linearLayout.addView(borderView)

        // Create a ReactRootView and assign it to mReactRootView
        mReactRootView = ReactRootView(this)
        val reactViewParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f)
        mReactRootView!!.layoutParams = reactViewParams

        // Add ReactView to the linear layout
        linearLayout.addView(mReactRootView)

        // Set the linear layout as the content view
        setContentView(linearLayout)

        // Load the React application
        mReactRootView!!.startReactApplication(
                (application as MainApplication).reactNativeHost.reactInstanceManager,
                mainComponentName,
                appOptions
        )
    }

    /**
     * Returns the name of the main component registered from JavaScript.
     * This is used to schedule rendering of the component.
     */
    override fun getMainComponentName(): String {
        return "gutenberg"
    }

    private val appOptions: Bundle
        get() {
            val bundle = Bundle()

            // Parse initial props from launch arguments
            var initialTitle: String? = null
            var initialData: String? = null
            var rawStyles: String? = null
            var rawFeatures: String? = null
            val extrasBundle = intent.extras
            if (extrasBundle != null) {
                val initialProps = extrasBundle.getString(EXTRAS_INITIAL_PROPS, "{}")
                try {
                    val jsonObject = JSONObject(initialProps)
                    if (jsonObject.has(GutenbergProps.PROP_INITIAL_TITLE)) {
                        initialTitle = jsonObject.getString(GutenbergProps.PROP_INITIAL_TITLE)
                    }
                    if (jsonObject.has(GutenbergProps.PROP_INITIAL_DATA)) {
                        initialData = jsonObject.getString(GutenbergProps.PROP_INITIAL_DATA)
                    }
                    if (jsonObject.has(GutenbergProps.PROP_STYLES)) {
                        rawStyles = jsonObject.getString(GutenbergProps.PROP_STYLES)
                    }
                    if (jsonObject.has(GutenbergProps.PROP_FEATURES)) {
                        rawFeatures = jsonObject.getString(GutenbergProps.PROP_FEATURES)
                    }
                } catch (e: JSONException) {
                    Log.e("MainActivity", "Json parsing error: " + e.message)
                }
            }

            // Add locale
            val languageString = Locale.getDefault().toString()
            val localeSlug = languageString.replace("_", "-").lowercase()
            bundle.putString(GutenbergProps.PROP_LOCALE, localeSlug)

            // Add capabilities
            val capabilities = Bundle()
            capabilities.putBoolean(GutenbergProps.PROP_CAPABILITIES_MENTIONS, true)
            capabilities.putBoolean(GutenbergProps.PROP_CAPABILITIES_XPOSTS, true)
            capabilities.putBoolean(GutenbergProps.PROP_CAPABILITIES_UNSUPPORTED_BLOCK_EDITOR, true)
            capabilities.putBoolean(GutenbergProps.PROP_CAPABILITIES_REUSABLE_BLOCK, false)
            capabilities.putBoolean(GutenbergProps.PROP_CAPABILITIES_IS_AUDIO_BLOCK_MEDIA_UPLOAD_ENABLED, true)
            capabilities.putBoolean(GutenbergProps.PROP_CAPABILITIES_TILED_GALLERY_BLOCK, true)
            capabilities.putBoolean(GutenbergProps.PROP_CAPABILITIES_VIDEOPRESS_BLOCK, true)
            capabilities.putBoolean(GutenbergProps.PROP_CAPABILITIES_VIDEOPRESS_V5_SUPPORT, true)
            capabilities.putBoolean(GutenbergProps.PROP_CAPABILITIES_FACEBOOK_EMBED_BLOCK, true)
            capabilities.putBoolean(GutenbergProps.PROP_CAPABILITIES_INSTAGRAM_EMBED_BLOCK, true)
            capabilities.putBoolean(GutenbergProps.PROP_CAPABILITIES_LOOM_EMBED_BLOCK, true)
            capabilities.putBoolean(GutenbergProps.PROP_CAPABILITIES_SMARTFRAME_EMBED_BLOCK, true)
            bundle.putBundle(GutenbergProps.PROP_CAPABILITIES, capabilities)
            if (initialTitle != null) {
                bundle.putString(GutenbergProps.PROP_INITIAL_TITLE, initialTitle)
            }
            if (initialData != null) {
                bundle.putString(GutenbergProps.PROP_INITIAL_DATA, initialData)
            }
            if (rawStyles != null) {
                bundle.putString(GutenbergProps.PROP_STYLES, rawStyles)
            }
            if (rawFeatures != null) {
                bundle.putString(GutenbergProps.PROP_FEATURES, rawFeatures)
            }
            return bundle
        }

    companion object {
        var instance: MainActivity? = null
            private set
        private const val EXTRAS_INITIAL_PROPS = "initialProps"
    }
}
