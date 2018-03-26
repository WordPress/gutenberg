package com.example.android.recyclerview.AztecRN;


import android.content.Context;
import android.graphics.Color;
import android.text.Editable;
import android.text.TextWatcher;

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.react.views.textinput.ReactContentSizeChangedEvent;

public class ReactAztecManager extends SimpleViewManager<ReactAztecView> {

    public static final String REACT_CLASS = "RCTAztecView";
    private Context mCallerContext;

    public ReactAztecManager(Context ctx) {
        super();
        this.mCallerContext = ctx;
    }

    @Override
    public String getName() {
        return REACT_CLASS;
    }

    @Override
    protected ReactAztecView createViewInstance(ThemedReactContext reactContext) {
        return new ReactAztecView(reactContext, mCallerContext);
    }

    @ReactProp(name = "text")
    public void setText(ReactAztecView view, String text) {
        view.fromHtml(text);
    }

    @ReactProp(name = "color")
    public void setColor(ReactAztecView view, String color) {
        int newColor = Color.BLACK;
        try {
            newColor = Color.parseColor(color);
        } catch (IllegalArgumentException e) {
        }
        view.setTextColor(newColor);
    }

    @ReactProp(name = "maxImagesWidth")
    public void setMaxImagesWidth(ReactAztecView view, int maxWidth) {
        view.setMaxImagesWidth(maxWidth);
    }

    @ReactProp(name = "minImagesWidth")
    public void setMinImagesWidth(ReactAztecView view, int minWidth) {
        view.setMinImagesWidth(minWidth);
    }

    @ReactProp(name = "onContentSizeChange", defaultBoolean = false)
    public void setOnContentSizeChange(final ReactAztecView view, boolean onContentSizeChange) {
        if (onContentSizeChange) {
            view.setContentSizeWatcher(new AztecContentSizeWatcher(view));
        } else {
            view.setContentSizeWatcher(null);
        }
    }

    @Override
    protected void addEventEmitters(
            final ThemedReactContext reactContext,
            final ReactAztecView editText) {
        // addTextChangedListener is needed because it's the place where ReactAztecView add the
        // TextWatcherDelegator... that in order call onContentSizeChanged when needed and notifies JS
        editText.addTextChangedListener(new AztecTextInputTextWatcher(reactContext, editText));
    }

    private class AztecTextInputTextWatcher implements TextWatcher {

        private EventDispatcher mEventDispatcher;
        private ReactAztecView mEditText;
        private String mPreviousText;

        public AztecTextInputTextWatcher(
                final ReactContext reactContext,
                final ReactAztecView editText) {
            mEventDispatcher = reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher();
            mEditText = editText;
            mPreviousText = null;
        }

        @Override
        public void beforeTextChanged(CharSequence s, int start, int count, int after) {
            // Incoming charSequence gets mutated before onTextChanged() is invoked
            mPreviousText = s.toString();
        }

        @Override
        public void onTextChanged(CharSequence s, int start, int before, int count) {
            // Rearranging the text (i.e. changing between singleline and multiline attributes) can
            // also trigger onTextChanged, call the event in JS only when the text actually changed
            if (count == 0 && before == 0) {
                return;
            }

            Assertions.assertNotNull(mPreviousText);
            String newText = s.toString().substring(start, start + count);
            String oldText = mPreviousText.substring(start, start + before);
            // Don't send same text changes
            if (count == before && newText.equals(oldText)) {
                return;
            }

            //TODO - Danilo: These 2 events below are not yet handled in JS. Not sure we need to include them

        /*    // The event that contains the event counter and updates it must be sent first.
            // TODO: t7936714 merge these events
            mEventDispatcher.dispatchEvent(
                    new ReactTextChangedEvent(
                            mEditText.getId(),
                            s.toString(),
                            mEditText.incrementAndGetEventCounter()));

            mEventDispatcher.dispatchEvent(
                    new ReactTextInputEvent(
                            mEditText.getId(),
                            newText,
                            oldText,
                            start,
                            start + before));
                            */
        }

        @Override
        public void afterTextChanged(Editable s) {
        }
    }

    private class AztecContentSizeWatcher implements com.facebook.react.views.textinput.ContentSizeWatcher {
        private ReactAztecView mEditText;
        private EventDispatcher mEventDispatcher;
        private int mPreviousContentWidth = 0;
        private int mPreviousContentHeight = 0;

        public AztecContentSizeWatcher(ReactAztecView editText) {
            mEditText = editText;
            ReactContext reactContext = (ReactContext) editText.getContext();
            mEventDispatcher = reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher();
        }

        @Override
        public void onLayout() {
            int contentWidth = mEditText.getWidth();
            int contentHeight = mEditText.getHeight();

            // Use instead size of text content within EditText when available
            if (mEditText.getLayout() != null) {
                contentWidth = mEditText.getCompoundPaddingLeft() + mEditText.getLayout().getWidth() +
                        mEditText.getCompoundPaddingRight();
                contentHeight = mEditText.getCompoundPaddingTop() + mEditText.getLayout().getHeight() +
                        mEditText.getCompoundPaddingBottom();
            }

            if (contentWidth != mPreviousContentWidth || contentHeight != mPreviousContentHeight) {
                mPreviousContentHeight = contentHeight;
                mPreviousContentWidth = contentWidth;

                mEventDispatcher.dispatchEvent(
                        new ReactContentSizeChangedEvent(
                                mEditText.getId(),
                                PixelUtil.toDIPFromPixel(contentWidth),
                                PixelUtil.toDIPFromPixel(contentHeight)));
            }
        }
    }
}
