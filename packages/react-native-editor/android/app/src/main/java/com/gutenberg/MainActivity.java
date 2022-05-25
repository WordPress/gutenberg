package com.gutenberg;

import android.os.Bundle;

import androidx.annotation.Nullable;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactRootView;
import com.swmansion.gesturehandler.react.RNGestureHandlerEnabledRootView;

import org.wordpress.mobile.WPAndroidGlue.GutenbergProps;

import java.util.Locale;

public class MainActivity extends ReactActivity {

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
            @Override
            protected ReactRootView createRootView() {
                return new RNGestureHandlerEnabledRootView(MainActivity.this);
            }

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
