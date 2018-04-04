package com.example.android.ReactAztec;


import android.content.Context;
import android.graphics.Color;
import android.support.annotation.Nullable;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.View;
import android.widget.RelativeLayout;

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.react.views.textinput.ReactContentSizeChangedEvent;
import com.facebook.react.views.textinput.ReactTextChangedEvent;
import com.facebook.react.views.textinput.ReactTextInputEvent;
import com.facebook.react.views.scroll.ScrollEvent;
import com.facebook.react.views.scroll.ScrollEventType;
import com.facebook.react.views.textinput.ScrollWatcher;

import java.util.Map;

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
        // Creating a new RelativeLayout that will contain both AztecText and the Aztec Toolbar
        ReactAztecView reactAztecView = new ReactAztecView(reactContext);
        RelativeLayout.LayoutParams rlp = new RelativeLayout.LayoutParams(
                RelativeLayout.LayoutParams.MATCH_PARENT,
                RelativeLayout.LayoutParams.MATCH_PARENT);
        reactAztecView.setLayoutParams(rlp);


        ReactAztecText aztecText = new ReactAztecText(reactContext, mCallerContext);
        RelativeLayout.LayoutParams lp = new RelativeLayout.LayoutParams(
                RelativeLayout.LayoutParams.MATCH_PARENT,
                RelativeLayout.LayoutParams.MATCH_PARENT);
        //lp.addRule(RelativeLayout.CENTER_IN_PARENT);
        aztecText.setLayoutParams(lp);

        // Add the editor to the main component
        reactAztecView.setAztecText(aztecText);

        // TODO Create the toolbar and set the listeners here. Then add it to the main component

        return reactAztecView;
    }

    @Nullable
    @Override
    public Map<String, Object> getExportedCustomBubblingEventTypeConstants() {
        return MapBuilder.<String, Object>builder()
             /*   .put(
                        "topSubmitEditing",
                        MapBuilder.of(
                                "phasedRegistrationNames",
                                MapBuilder.of(
                                        "bubbled", "onSubmitEditing", "captured", "onSubmitEditingCapture")))*/
                .put(
                        "topEndEditing",
                        MapBuilder.of(
                                "phasedRegistrationNames",
                                MapBuilder.of("bubbled", "onEndEditing", "captured", "onEndEditingCapture")))
                .put(
                        "topTextInput",
                        MapBuilder.of(
                                "phasedRegistrationNames",
                                MapBuilder.of("bubbled", "onTextInput", "captured", "onTextInputCapture")))
                .put(
                        "topFocus",
                        MapBuilder.of(
                                "phasedRegistrationNames",
                                MapBuilder.of("bubbled", "onFocus", "captured", "onFocusCapture")))
                .put(
                        "topBlur",
                        MapBuilder.of(
                                "phasedRegistrationNames",
                                MapBuilder.of("bubbled", "onBlur", "captured", "onBlurCapture")))
              /*  .put(
                        "topKeyPress",
                        MapBuilder.of(
                                "phasedRegistrationNames",
                                MapBuilder.of("bubbled", "onKeyPress", "captured", "onKeyPressCapture")))*/
                .build();
    }

    @ReactProp(name = "text")
    public void setText(ReactAztecView view, String text) {
        view.getAztecText().fromHtml(text);
    }

    @ReactProp(name = "color")
    public void setColor(ReactAztecView view, String color) {
        int newColor = Color.BLACK;
        try {
            newColor = Color.parseColor(color);
        } catch (IllegalArgumentException e) {
        }
        view.getAztecText().setTextColor(newColor);
    }

    @ReactProp(name = "maxImagesWidth")
    public void setMaxImagesWidth(ReactAztecView view, int maxWidth) {
        view.getAztecText().setMaxImagesWidth(maxWidth);
    }

    @ReactProp(name = "minImagesWidth")
    public void setMinImagesWidth(ReactAztecView view, int minWidth) {
        view.getAztecText().setMinImagesWidth(minWidth);
    }

    @ReactProp(name = "onContentSizeChange", defaultBoolean = false)
    public void setOnContentSizeChange(final ReactAztecView view, boolean onContentSizeChange) {
        if (onContentSizeChange) {
            view.getAztecText().setContentSizeWatcher(new AztecContentSizeWatcher(view.getAztecText()));
        } else {
            view.getAztecText().setContentSizeWatcher(null);
        }
    }

    @ReactProp(name = "onScroll", defaultBoolean = false)
    public void setOnScroll(final ReactAztecView view, boolean onScroll) {
        if (onScroll) {
            view.getAztecText().setScrollWatcher(new AztecScrollWatcher(view.getAztecText()));
        } else {
            view.getAztecText().setScrollWatcher(null);
        }
    }

    @Override
    protected void addEventEmitters(
            final ThemedReactContext reactContext,
            final ReactAztecView container) {

        final ReactAztecText editText = container.getAztecText();
        editText.addTextChangedListener(new AztecTextWatcher(reactContext, editText));
        editText.setOnFocusChangeListener(
                new View.OnFocusChangeListener() {
                    public void onFocusChange(View v, boolean hasFocus) {
                        EventDispatcher eventDispatcher =
                                reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher();
                        if (hasFocus) {
                            eventDispatcher.dispatchEvent(
                                    new ReactAztecFocusEvent(
                                            editText.getId()));
                        } else {
                            eventDispatcher.dispatchEvent(
                                    new ReactAztecBlurEvent(
                                            editText.getId()));

                            eventDispatcher.dispatchEvent(
                                    new ReactaztecEndEditingEvent(
                                            editText.getId(),
                                            editText.getText().toString()));
                        }
                    }
                });

        // Don't think we need to add setOnEditorActionListener here (intercept Enter for example), but
        // in case check ReactTextInputManager
    }

    private class AztecTextWatcher implements TextWatcher {

        private EventDispatcher mEventDispatcher;
        private ReactAztecText mEditText;
        private String mPreviousText;

        public AztecTextWatcher(
                final ReactContext reactContext,
                final ReactAztecText editText) {
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

            // The event that contains the event counter and updates it must be sent first.
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
        }

        @Override
        public void afterTextChanged(Editable s) {
        }
    }

    private class AztecContentSizeWatcher implements com.facebook.react.views.textinput.ContentSizeWatcher {
        private ReactAztecText mEditText;
        private EventDispatcher mEventDispatcher;
        private int mPreviousContentWidth = 0;
        private int mPreviousContentHeight = 0;

        public AztecContentSizeWatcher(ReactAztecText editText) {
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

    private class AztecScrollWatcher implements ScrollWatcher {

        private ReactAztecText mReactAztecText;
        private EventDispatcher mEventDispatcher;
        private int mPreviousHoriz;
        private int mPreviousVert;

        public AztecScrollWatcher(ReactAztecText editText) {
            mReactAztecText = editText;
            ReactContext reactContext = (ReactContext) editText.getContext();
            mEventDispatcher = reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher();
        }

        @Override
        public void onScrollChanged(int horiz, int vert, int oldHoriz, int oldVert) {
            if (mPreviousHoriz != horiz || mPreviousVert != vert) {
                ScrollEvent event = ScrollEvent.obtain(
                        mReactAztecText.getId(),
                        ScrollEventType.SCROLL,
                        horiz,
                        vert,
                        0f, // can't get x velocity
                        0f, // can't get y velocity
                        0, // can't get content width
                        0, // can't get content height
                        mReactAztecText.getWidth(),
                        mReactAztecText.getHeight());

                mEventDispatcher.dispatchEvent(event);

                mPreviousHoriz = horiz;
                mPreviousVert = vert;
            }
        }
    }
}
