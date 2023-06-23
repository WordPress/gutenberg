package com.gutenberg;

import android.os.Bundle;
import android.view.Menu;
import android.view.MenuItem;

import androidx.annotation.Nullable;
import androidx.appcompat.widget.Toolbar;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactRootView;

import org.wordpress.mobile.WPAndroidGlue.GutenbergProps;

import java.util.Locale;

public class MainActivity extends ReactActivity {
    private static MainActivity currentInstance;

    private ReactRootView mReactRootView;
    private Menu mMenu;

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

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        currentInstance = this;

        setContentView(R.layout.activity_main);

        // Create and configure the Toolbar
        Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);
        getSupportActionBar().setDisplayShowTitleEnabled(false);

        mReactRootView = findViewById(R.id.react_root_view);
        mReactRootView.startReactApplication(getReactNativeHost().getReactInstanceManager(), "gutenberg", null);
    }

    public static MainActivity getInstance() {
        return currentInstance;
    }

    /**
     * Returns the name of the main component registered from JavaScript.
     * This is used to schedule rendering of the component.
     */
    @Override
    protected String getMainComponentName() {
        return "gutenberg";
    }

    @Override
    protected ReactActivityDelegate createReactActivityDelegate() {
        return new ReactActivityDelegate(this, getMainComponentName()) {
            @Nullable
            @Override
            protected Bundle getLaunchOptions() {
                Bundle bundle = new Bundle();

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
                return bundle;
            }
        };
    }
}
