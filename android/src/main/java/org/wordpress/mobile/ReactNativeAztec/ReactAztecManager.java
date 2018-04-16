package org.wordpress.mobile.ReactNativeAztec;


import android.content.Context;
import android.graphics.Color;
import android.support.annotation.Nullable;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;

import org.wordpress.mobile.ReactNativeAztec.R;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.react.views.scroll.ScrollEvent;
import com.facebook.react.views.scroll.ScrollEventType;
import com.facebook.react.views.textinput.ReactContentSizeChangedEvent;
import com.facebook.react.views.textinput.ReactTextChangedEvent;
import com.facebook.react.views.textinput.ReactTextInputEvent;
import com.facebook.react.views.textinput.ScrollWatcher;

import org.jetbrains.annotations.NotNull;
import org.wordpress.aztec.ITextFormat;
import org.wordpress.aztec.source.SourceViewEditText;
import org.wordpress.aztec.toolbar.AztecToolbar;
import org.wordpress.aztec.toolbar.IAztecToolbarClickListener;

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
        LayoutInflater li = LayoutInflater.from(mCallerContext);
        ReactAztecView aztecView = (ReactAztecView) li.inflate(R.layout.aztec_main, null);
        ReactAztecText aztecText = aztecView.findViewById(R.id.aztec);
        aztecView.setAztecText(aztecText);
        SourceViewEditText sourceEditor = aztecView.findViewById(R.id.source);
        aztecView.setSourceEditor(sourceEditor);
        AztecToolbar toolbar = aztecView.findViewById(R.id.formatting_toolbar);
        aztecView.setToolbar(toolbar);

        // init Toolbar
        toolbar.setEditor(aztecText, sourceEditor);
        toolbar.setToolbarListener(new ToolbarClickListener(aztecView));
        aztecText.setToolbar(toolbar);
        //initSourceEditorHistory();

        aztecText.setCalypsoMode(false);
        sourceEditor.setCalypsoMode(false);

        return aztecView;
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
        view.getSourceEditor().displayStyledAndFormattedHtml(text);
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
            view.getAztecText().setContentSizeWatcher(new AztecContentSizeWatcher(view));
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
    protected void addEventEmitters(final ThemedReactContext reactContext, final ReactAztecView aztecView) {
        aztecView.getAztecText().addTextChangedListener(new AztecTextWatcher(reactContext, aztecView));
        aztecView.getAztecText().setOnFocusChangeListener(
                new View.OnFocusChangeListener() {
                    public void onFocusChange(View v, boolean hasFocus) {
                        EventDispatcher eventDispatcher = reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher();
                        final ReactAztecText editText = (ReactAztecText)v;
                        if (hasFocus) {
                            eventDispatcher.dispatchEvent(
                                    new ReactAztecFocusEvent(
                                            aztecView.getId()));
                        } else {
                            eventDispatcher.dispatchEvent(
                                    new ReactAztecBlurEvent(
                                            aztecView.getId()));

                            eventDispatcher.dispatchEvent(
                                    new ReactAztecEndEditingEvent(
                                            aztecView.getId(),
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
        private ReactAztecView mAztecView;
        private String mPreviousText;

        public AztecTextWatcher(final ReactContext reactContext, final ReactAztecView aztec) {
            mEventDispatcher = reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher();
            mAztecView = aztec;
            mEditText = aztec.getAztecText();
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
                            mAztecView.getId(),
                            s.toString(),
                            mEditText.incrementAndGetEventCounter()));

            mEventDispatcher.dispatchEvent(
                    new ReactTextInputEvent(
                            mAztecView.getId(),
                            newText,
                            oldText,
                            start,
                            start + before));
        }

        @Override
        public void afterTextChanged(Editable s) {
        }
    }

    private class ToolbarClickListener implements IAztecToolbarClickListener {
        private ReactAztecView mAztecView;

        public ToolbarClickListener(ReactAztecView aztecView) {
            this.mAztecView = aztecView;
        }

        @Override
        public void onToolbarCollapseButtonClicked() {

        }

        @Override
        public void onToolbarExpandButtonClicked() {

        }

        @Override
        public void onToolbarFormatButtonClicked(@NotNull ITextFormat format, boolean isKeyboardShortcut) {

        }

        @Override
        public void onToolbarHeadingButtonClicked() {

        }

        @Override
        public void onToolbarHtmlButtonClicked() {
            mAztecView.getToolbar().toggleEditorMode();
        }

        @Override
        public void onToolbarListButtonClicked() {

        }

        @Override
        public boolean onToolbarMediaButtonClicked() {
            return false;
        }
    }

    private class AztecContentSizeWatcher implements com.facebook.react.views.textinput.ContentSizeWatcher {
        private ReactAztecView mReactAztecView;
        private EventDispatcher mEventDispatcher;
        private int mPreviousContentWidth = 0;
        private int mPreviousContentHeight = 0;

        public AztecContentSizeWatcher(ReactAztecView view) {
            mReactAztecView = view;
            ReactContext reactContext = (ReactContext) mReactAztecView.getAztecText().getContext();
            mEventDispatcher = reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher();
        }

        @Override
        public void onLayout() {
            final ReactAztecText aztecText = mReactAztecView.getAztecText();
            int contentWidth = aztecText.getWidth();
            int contentHeight = aztecText.getHeight();

            // Use instead size of text content within EditText when available
            if (aztecText.getLayout() != null) {
                contentWidth = aztecText.getCompoundPaddingLeft() + aztecText.getLayout().getWidth() +
                        aztecText.getCompoundPaddingRight();
                contentHeight = aztecText.getCompoundPaddingTop() + aztecText.getLayout().getHeight() +
                        aztecText.getCompoundPaddingBottom();
            }

            if (contentWidth != mPreviousContentWidth || contentHeight != mPreviousContentHeight) {
                mPreviousContentHeight = contentHeight;
                mPreviousContentWidth = contentWidth;

                // FIXME: Note the 2 hacks here
                mEventDispatcher.dispatchEvent(
                        new ReactContentSizeChangedEvent(
                                mReactAztecView.getId(), // Note the ID of the parent here ;)
                                PixelUtil.toDIPFromPixel(contentWidth) + 48,
                                PixelUtil.toDIPFromPixel(contentHeight) + 48));
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
