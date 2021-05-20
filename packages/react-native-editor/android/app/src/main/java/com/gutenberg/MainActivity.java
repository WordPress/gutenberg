package com.gutenberg;

import android.os.Bundle;

import androidx.annotation.Nullable;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;

import org.wordpress.mobile.WPAndroidGlue.GutenbergProps;

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
            @Nullable
            @Override
            protected Bundle getLaunchOptions() {
                Bundle bundle = new Bundle();
                Bundle capabilities = new Bundle();
                capabilities.putBoolean(GutenbergProps.PROP_CAPABILITIES_MENTIONS, true);
                capabilities.putBoolean(GutenbergProps.PROP_CAPABILITIES_XPOSTS, true);
                capabilities.putBoolean(GutenbergProps.PROP_CAPABILITIES_UNSUPPORTED_BLOCK_EDITOR, true);
                capabilities.putBoolean(GutenbergProps.PROP_CAPABILITIES_AUDIO_BLOCK, true);
                capabilities.putBoolean(GutenbergProps.PROP_CAPABILITIES_CAN_VIEW_EDITOR_ONBOARDING, false);
                bundle.putBundle(GutenbergProps.PROP_CAPABILITIES, capabilities);
                return bundle;
            }
        };
    }
}
