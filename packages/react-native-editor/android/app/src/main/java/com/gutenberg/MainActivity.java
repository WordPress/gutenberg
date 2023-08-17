package com.gutenberg;

import android.os.Bundle;
import android.util.Log;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;

import androidx.appcompat.widget.Toolbar;
import androidx.core.content.ContextCompat;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactRootView;

import org.json.JSONException;
import org.json.JSONObject;
import org.wordpress.mobile.WPAndroidGlue.GutenbergProps;

import java.util.Locale;

public class MainActivity extends ReactActivity {
    private static MainActivity currentInstance;

    private ReactRootView mReactRootView;
    private Menu mMenu;

    private static final String EXTRAS_INITIAL_PROPS = "initialProps";

    private void openReactNativeDebugMenu() {
        ReactInstanceManager devSettingsModule = getReactInstanceManager();
        if (devSettingsModule != null) {
            devSettingsModule.showDevOptionsDialog();
        }
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        mMenu = menu;
        getMenuInflater().inflate(R.menu.toolbar_menu, menu);

        // Set opacity for menu items
        MenuItem undoItem = menu.findItem(R.id.menuUndo);
        undoItem.getIcon().setAlpha(76);
        undoItem.setEnabled(false);

        MenuItem redoItem = menu.findItem(R.id.menuRedo);
        redoItem.getIcon().setAlpha(76);
        redoItem.setEnabled(false);
        return true;
    }

    public void updateUndoItem(boolean isDisabled) {
        if (mMenu != null) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    MenuItem undoItem = mMenu.findItem(R.id.menuUndo);

                    undoItem.setEnabled(!isDisabled);
                    undoItem.getIcon().setAlpha(!isDisabled ? 255 : 76);
                }
            });
        }
    }

    public void updateRedoItem(boolean isDisabled) {
        if (mMenu != null) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    MenuItem redoItem = mMenu.findItem(R.id.menuRedo);

                    redoItem.setEnabled(!isDisabled);
                    redoItem.getIcon().setAlpha(!isDisabled ? 255 : 76);
                }
            });
        }
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        MainApplication mainApplication = (MainApplication) getApplication();

        int itemId = item.getItemId();
        if (itemId == R.id.menuUndo) {
            mainApplication.toggleUndo();
            return true;
        }
        if (itemId == R.id.menuRedo) {
            mainApplication.toggleRedo();
            return true;
        }
        if (itemId == R.id.menuButton) {
            openReactNativeDebugMenu();
            return true;
        }
        return super.onOptionsItemSelected(item);
    }

    public static MainActivity getInstance() {
        return currentInstance;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        currentInstance = this;

        // Create a LinearLayout that will hold both the toolbar and React Native content
        LinearLayout linearLayout = new LinearLayout(this);
        linearLayout.setOrientation(LinearLayout.VERTICAL);
        linearLayout.setLayoutParams(new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        // Create a Toolbar instance
        Toolbar toolbar = new Toolbar(this);

        // Set toolbar properties (you can customize this as you want)
        toolbar.setLayoutParams(new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        // Set the toolbar as the Activity's action bar
        setSupportActionBar(toolbar);

        // Add the toolbar to the linear layout
        linearLayout.addView(toolbar);

        // Create a View to be used as the border
        View borderView = new View(this);
        borderView.setLayoutParams(new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 1));
        borderView.setBackgroundColor(ContextCompat.getColor(this, R.color.toolbarBorder));

        // Add the border view to the linear layout
        linearLayout.addView(borderView);

        // Create a ReactRootView and assign it to mReactRootView
        mReactRootView = new ReactRootView(this);
        LinearLayout.LayoutParams reactViewParams = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1);
        mReactRootView.setLayoutParams(reactViewParams);

        // Add ReactView to the linear layout
        linearLayout.addView(mReactRootView);

        // Set the linear layout as the content view
        setContentView(linearLayout);

        // Load the React application
        mReactRootView.startReactApplication(
                ((MainApplication) getApplication()).getReactNativeHost().getReactInstanceManager(),
                getMainComponentName(),
                getAppOptions()
        );
    }

    /**
     * Returns the name of the main component registered from JavaScript.
     * This is used to schedule rendering of the component.
     */
    @Override
    protected String getMainComponentName() {
        return "gutenberg";
    }

    private Bundle getAppOptions() {
        Bundle bundle = new Bundle();

        // Parse initial props from launch arguments
        String initialData = null;
        Bundle extrasBundle = getIntent().getExtras();
        if(extrasBundle != null) {
            String initialProps = extrasBundle.getString(EXTRAS_INITIAL_PROPS, "{}");
            try {
                JSONObject jsonObject = new JSONObject(initialProps);
                if (jsonObject.has(GutenbergProps.PROP_INITIAL_DATA)) {
                    initialData = jsonObject.getString(GutenbergProps.PROP_INITIAL_DATA);
                }
            } catch (final JSONException e) {
                Log.e("MainActivity", "Json parsing error: " + e.getMessage());
            }
        }

        // Add locale
        String languageString = Locale.getDefault().toString();
        String localeSlug = languageString.replace("_", "-").toLowerCase(Locale.ENGLISH);
        bundle.putString(GutenbergProps.PROP_LOCALE, localeSlug);

        // Add capabilities
        Bundle capabilities = new Bundle();
        capabilities.putBoolean(GutenbergProps.PROP_CAPABILITIES_MENTIONS, true);
        capabilities.putBoolean(GutenbergProps.PROP_CAPABILITIES_XPOSTS, true);
        capabilities.putBoolean(GutenbergProps.PROP_CAPABILITIES_UNSUPPORTED_BLOCK_EDITOR, true);
        capabilities.putBoolean(GutenbergProps.PROP_CAPABILITIES_REUSABLE_BLOCK, false);
        capabilities.putBoolean(GutenbergProps.PROP_CAPABILITIES_IS_AUDIO_BLOCK_MEDIA_UPLOAD_ENABLED, true);
        capabilities.putBoolean(GutenbergProps.PROP_CAPABILITIES_TILED_GALLERY_BLOCK, true);
        capabilities.putBoolean(GutenbergProps.PROP_CAPABILITIES_VIDEOPRESS_BLOCK, true);
        capabilities.putBoolean(GutenbergProps.PROP_CAPABILITIES_FACEBOOK_EMBED_BLOCK, true);
        capabilities.putBoolean(GutenbergProps.PROP_CAPABILITIES_INSTAGRAM_EMBED_BLOCK, true);
        capabilities.putBoolean(GutenbergProps.PROP_CAPABILITIES_LOOM_EMBED_BLOCK, true);
        capabilities.putBoolean(GutenbergProps.PROP_CAPABILITIES_SMARTFRAME_EMBED_BLOCK, true);
        bundle.putBundle(GutenbergProps.PROP_CAPABILITIES, capabilities);

        if(initialData != null) {
            bundle.putString(GutenbergProps.PROP_INITIAL_DATA, initialData);
        }

        return bundle;
    }
}
