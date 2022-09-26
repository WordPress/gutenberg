package org.wordpress.mobile.ReactNativeAztec;

import android.widget.EditText;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.views.textinput.ReactTextInputShadowNode;

public class ReactAztecTextShadowNode extends ReactTextInputShadowNode {

    @Override
    protected EditText createInternalEditText() {
        return new EditText(getThemedContext(), null, 0);
    }

    @ReactProp(name = PROP_TEXT)
    public void setText(@Nullable ReadableMap inputMap) {
        markUpdated();
    }

    @ReactProp(name = "color", customType = "Color")
    public void setColor(@Nullable Integer color) {
        markUpdated();
    }
}
