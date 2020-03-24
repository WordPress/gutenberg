package org.wordpress.mobile.ReactNativeAztec;

import android.widget.EditText;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;

public class ReactAztecTextShadowNode extends ReactTextInputShadowNodeFork {

    @Override
    protected EditText createDummyEditText(ThemedReactContext themedContext) {
        return new EditText(themedContext, null, 0);
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
