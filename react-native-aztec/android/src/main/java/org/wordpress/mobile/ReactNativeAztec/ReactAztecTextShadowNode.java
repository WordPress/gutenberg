package org.wordpress.mobile.ReactNativeAztec;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.views.textinput.ReactTextInputShadowNode;

public class ReactAztecTextShadowNode extends ReactTextInputShadowNode {
    private @Nullable ReadableMap mTextMap = null;
    private @Nullable Integer mColor = null;

    @Override
    public void setDefaultPadding(int spacingType, float padding) {
        // Do nothing in order to avoid adding unwanted default padding to views
        // (https://github.com/wordpress-mobile/gutenberg-mobile/issues/992) due to
        // https://github.com/facebook/react-native/blob/6ebd3b046e5b71130281f1a7dbe7220eff95d74a/ReactAndroid/src/main/java/com/facebook/react/views/textinput/ReactTextInputShadowNode.java#L70
    }

    @ReactProp(name = PROP_TEXT)
    public void setText(@Nullable ReadableMap inputMap) {
        mTextMap = inputMap;
        markUpdated();
    }

    @ReactProp(name = "color", customType = "Color")
    public void setColor(@Nullable Integer color) {
        mColor = color;
        markUpdated();
    }
}
