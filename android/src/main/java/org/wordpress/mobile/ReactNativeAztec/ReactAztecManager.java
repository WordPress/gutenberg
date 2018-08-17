package org.wordpress.mobile.ReactNativeAztec;


import android.graphics.Color;
import android.support.annotation.Nullable;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.View;
import android.util.Log;

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.react.views.scroll.ScrollEvent;
import com.facebook.react.views.scroll.ScrollEventType;
import com.facebook.react.views.text.DefaultStyleValuesUtil;
import com.facebook.react.views.textinput.ReactContentSizeChangedEvent;
import com.facebook.react.views.textinput.ReactTextChangedEvent;
import com.facebook.react.views.textinput.ReactTextInputEvent;
import com.facebook.react.views.textinput.ScrollWatcher;

import java.util.Map;

public class ReactAztecManager extends SimpleViewManager<ReactAztecText> {

    public static final String REACT_CLASS = "RCTAztecView";

    @Override
    public String getName() {
        return REACT_CLASS;
    }

    @Override
    protected ReactAztecText createViewInstance(ThemedReactContext reactContext) {
        ReactAztecText aztecText = new ReactAztecText(reactContext);
        aztecText.setCalypsoMode(false);

        return aztecText;
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
                        "topChange",
                        MapBuilder.of(
                                "phasedRegistrationNames",
                                MapBuilder.of("bubbled", "onChange")))
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
    public void setText(ReactAztecText view, ReadableMap inputMap) {
        if (!inputMap.hasKey("eventCount")) {
            setTextfromJS(view, inputMap.getString("text"));
        } else {
            // Don't think there is necessity of this branch, but justin case we want to
            // force a 2nd setText from JS side to Native, just set a high eventCount
            int eventCount = inputMap.getInt("eventCount");
            if (view.mNativeEventCount < eventCount) {
                setTextfromJS(view, inputMap.getString("text"));
            }
        }
    }

    private void setTextfromJS(ReactAztecText view, String text) {
        view.setIsSettingTextFromJS(true);
        view.fromHtml(text);
        view.setIsSettingTextFromJS(false);
    }

    @ReactProp(name = "color")
    public void setColor(ReactAztecText view, String color) {
        int newColor = Color.BLACK;
        try {
            newColor = Color.parseColor(color);
        } catch (IllegalArgumentException e) {
        }
        view.setTextColor(newColor);
    }

    @ReactProp(name = "placeholder")
    public void setPlaceholder(ReactAztecText view, @Nullable String placeholder) {
        view.setHint(placeholder);
    }

    @ReactProp(name = "placeholderTextColor", customType = "Color")
    public void setPlaceholderTextColor(ReactAztecText view, @Nullable Integer color) {
        if (color == null) {
            view.setHintTextColor(DefaultStyleValuesUtil.getDefaultTextColorHint(view.getContext()));
        } else {
            view.setHintTextColor(color);
        }
    }

    @ReactProp(name = "maxImagesWidth")
    public void setMaxImagesWidth(ReactAztecText view, int maxWidth) {
        view.setMaxImagesWidth(maxWidth);
    }

    @ReactProp(name = "minImagesWidth")
    public void setMinImagesWidth(ReactAztecText view, int minWidth) {
        view.setMinImagesWidth(minWidth);
    }

    @ReactProp(name = "onContentSizeChange", defaultBoolean = false)
    public void setOnContentSizeChange(final ReactAztecText view, boolean onContentSizeChange) {
        if (onContentSizeChange) {
            view.setContentSizeWatcher(new AztecContentSizeWatcher(view));
        } else {
            view.setContentSizeWatcher(null);
        }
    }

    @ReactProp(name = "onScroll", defaultBoolean = false)
    public void setOnScroll(final ReactAztecText view, boolean onScroll) {
        if (onScroll) {
            view.setScrollWatcher(new AztecScrollWatcher(view));
        } else {
            view.setScrollWatcher(null);
        }
    }

    private static final int COMMAND_NOTIFY_APPLY_FORMAT = 1;
    private static final String TAG = "ReactAztecText";

    @Override
    public Map<String, Integer> getCommandsMap() {
        return MapBuilder.of("applyFormat", COMMAND_NOTIFY_APPLY_FORMAT);
    }

    @Override
    public void receiveCommand(final ReactAztecText parent, int commandType, @Nullable ReadableArray args) {
        Assertions.assertNotNull(parent);
        Assertions.assertNotNull(args);
        switch (commandType) {
        case COMMAND_NOTIFY_APPLY_FORMAT: {
            final String format = args.getString(0);            
            Log.d(TAG, String.format("Apply format: %s", format)); 
            parent.applyFormat(format);           
            return;
        }
        }
    }

    @Override
    protected void addEventEmitters(final ThemedReactContext reactContext, final ReactAztecText aztecText) {
        aztecText.addTextChangedListener(new AztecTextWatcher(reactContext, aztecText));
        aztecText.setOnFocusChangeListener(
                new View.OnFocusChangeListener() {
                    public void onFocusChange(View v, boolean hasFocus) {
                        EventDispatcher eventDispatcher = reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher();
                        final ReactAztecText editText = (ReactAztecText)v;
                        if (hasFocus) {
                            eventDispatcher.dispatchEvent(
                                    new ReactAztecFocusEvent(
                                            editText.getId()));
                        } else {
                            eventDispatcher.dispatchEvent(
                                    new ReactAztecBlurEvent(
                                            editText.getId()));

                            eventDispatcher.dispatchEvent(
                                    new ReactAztecEndEditingEvent(
                                            editText.getId(),
                                            editText.toHtml(false)));
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

        public AztecTextWatcher(final ReactContext reactContext, final ReactAztecText aztecText) {
            mEventDispatcher = reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher();
            mEditText = aztecText;
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
                            mEditText.toHtml(false),
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
        private ReactAztecText mReactAztecText;
        private EventDispatcher mEventDispatcher;
        private int mPreviousContentWidth = 0;
        private int mPreviousContentHeight = 0;

        public AztecContentSizeWatcher(ReactAztecText view) {
            mReactAztecText = view;
            ReactContext reactContext = (ReactContext) mReactAztecText.getContext();
            mEventDispatcher = reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher();
        }

        @Override
        public void onLayout() {
            int contentWidth = mReactAztecText.getWidth();
            int contentHeight = mReactAztecText.getHeight();

            // Use instead size of text content within EditText when available
            if (mReactAztecText.getLayout() != null) {
                contentWidth = mReactAztecText.getCompoundPaddingLeft() + mReactAztecText.getLayout().getWidth() +
                        mReactAztecText.getCompoundPaddingRight();
                contentHeight = mReactAztecText.getCompoundPaddingTop() + mReactAztecText.getLayout().getHeight() +
                        mReactAztecText.getCompoundPaddingBottom();
            }

            if (contentWidth != mPreviousContentWidth || contentHeight != mPreviousContentHeight) {
                mPreviousContentHeight = contentHeight;
                mPreviousContentWidth = contentWidth;

                // FIXME: Note the 2 hacks here
                mEventDispatcher.dispatchEvent(
                        new ReactContentSizeChangedEvent(
                                mReactAztecText.getId(),
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
