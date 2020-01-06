package org.wordpress.mobile.ReactNativeAztec;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.views.textinput.ReactTextInputShadowNode;

public class ReactAztecTextShadowNode extends ReactTextInputShadowNode {
    private @Nullable ReadableMap mTextMap = null;
    private @Nullable Integer mColor = null;

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
