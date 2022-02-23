package org.wordpress.mobile.ReactNativeAztec;


import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.text.LineBreaker;
import android.os.Build;
import androidx.annotation.Nullable;
import androidx.annotation.RequiresApi;
import androidx.core.graphics.ColorUtils;
import androidx.core.util.Consumer;

import android.os.Handler;
import android.os.Looper;
import android.text.Editable;
import android.text.Layout;
import android.text.TextUtils;
import android.text.TextWatcher;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.BaseViewManager;
import com.facebook.react.uimanager.LayoutShadowNode;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.ViewDefaults;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.react.views.scroll.ScrollEvent;
import com.facebook.react.views.scroll.ScrollEventType;
import com.facebook.react.views.text.DefaultStyleValuesUtil;
import com.facebook.react.views.text.ReactFontManager;
import com.facebook.react.views.text.ReactTextUpdate;
import com.facebook.react.views.textinput.ReactContentSizeChangedEvent;
import com.facebook.react.views.textinput.ReactTextInputEvent;
import com.facebook.react.views.textinput.ReactTextInputManager;
import com.facebook.react.views.textinput.ScrollWatcher;

import org.wordpress.aztec.Constants;
import org.wordpress.aztec.formatting.LinkFormatter;
import org.wordpress.aztec.glideloader.GlideImageLoader;
import org.wordpress.aztec.glideloader.GlideVideoThumbnailLoader;
import org.wordpress.aztec.plugins.CssUnderlinePlugin;
import org.wordpress.aztec.plugins.shortcodes.AudioShortcodePlugin;
import org.wordpress.aztec.plugins.shortcodes.CaptionShortcodePlugin;
import org.wordpress.aztec.plugins.shortcodes.VideoShortcodePlugin;
import org.wordpress.aztec.plugins.wpcomments.HiddenGutenbergPlugin;
import org.wordpress.aztec.plugins.wpcomments.WordPressCommentsPlugin;
import org.wordpress.aztec.plugins.wpcomments.toolbar.MoreToolbarButton;

import java.util.Map;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class ReactAztecManager extends BaseViewManager<ReactAztecText, LayoutShadowNode> {

    public static final String REACT_CLASS = "RCTAztecView";

    private static final int FOCUS_TEXT_INPUT = 1;
    private static final int BLUR_TEXT_INPUT = 2;
    private static final int UNSET = -1;

    // we define the same codes in ReactAztecText as they have for ReactNative's TextInput, so
    // it's easier to handle focus between Aztec and TextInput instances on the same screen.
    // see https://github.com/wordpress-mobile/react-native-aztec/pull/79
    private int mFocusTextInputCommandCode = FOCUS_TEXT_INPUT; // pre-init
    private int mBlurTextInputCommandCode = BLUR_TEXT_INPUT; // pre-init

    private static final String TAG = "ReactAztecText";

    private static final String BLOCK_TYPE_TAG_KEY = "tag";
    private static final String LINK_TEXT_COLOR_KEY = "linkTextColor";

    private float mCurrentFontSize = 0;
    private float mCurrentLineHeight = 0;

    @Nullable private final Consumer<Exception> exceptionLogger;
    @Nullable private final Consumer<String> breadcrumbLogger;

    public ReactAztecManager(@Nullable Consumer<Exception> exceptionLogger, @Nullable Consumer<String> breadcrumbLogger) {
        this.exceptionLogger = exceptionLogger;
        this.breadcrumbLogger = breadcrumbLogger;
        initializeFocusAndBlurCommandCodes();
    }

    private void initializeFocusAndBlurCommandCodes() {
        // For this, we'd like to keep track of potential command code changes in the future,
        // so we obtain an instance of ReactTextInputManager and call getCommandsMap in our
        // constructor to use the very same codes as TextInput does.
        ReactTextInputManager reactTextInputManager = new ReactTextInputManager();
        Map<String, Integer> map = reactTextInputManager.getCommandsMap();
        mFocusTextInputCommandCode = map.get("focusTextInput");
        mBlurTextInputCommandCode = map.get("blurTextInput");
    }

    @Override
    public String getName() {
        return REACT_CLASS;
    }

    @Override
    protected ReactAztecText createViewInstance(ThemedReactContext reactContext) {
        ReactAztecText aztecText = new ReactAztecText(reactContext);
        aztecText.setFocusableInTouchMode(false);
        aztecText.setEnabled(true);
        aztecText.setCalypsoMode(false);
        aztecText.setPadding(0, 0, 0, 0);
        // This is a temporary hack that sets the correct GB link color and underline
        // see: https://github.com/wordpress-mobile/gutenberg-mobile/pull/1109
        aztecText.setLinkFormatter(new LinkFormatter(aztecText,
                new LinkFormatter.LinkStyle(
                        Color.parseColor("#016087"), true)
        ));
        aztecText.addPlugin(new CssUnderlinePlugin());
        return aztecText;
    }

    @Override
    public LayoutShadowNode createShadowNodeInstance() {
        return new ReactAztecTextShadowNode();
    }

    @Override
    public Class<? extends LayoutShadowNode> getShadowNodeClass() {
        return ReactAztecTextShadowNode.class;
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
                        "topAztecChange",
                        MapBuilder.of(
                                "phasedRegistrationNames",
                                MapBuilder.of("bubbled", "onChange")))
                .put(
                        "topFormatsChanges",
                        MapBuilder.of(
                                "phasedRegistrationNames",
                                MapBuilder.of("bubbled", "onActiveFormatsChange")))
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
                        "topTextInputEnter",
                        MapBuilder.of(
                                "phasedRegistrationNames",
                                MapBuilder.of("bubbled", "onEnter")))
                .put(
                        "topTextInputBackspace",
                        MapBuilder.of(
                                "phasedRegistrationNames",
                                MapBuilder.of("bubbled", "onBackspace")))
                .put(
                        "topTextInputPaste",
                        MapBuilder.of(
                                "phasedRegistrationNames",
                                MapBuilder.of("bubbled", "onPaste")))
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

    @Nullable
    @Override
    public Map getExportedCustomDirectEventTypeConstants() {
        return MapBuilder.of(
                "topSelectionChange",
                MapBuilder.of("registrationName", "onSelectionChange")
                );
    }

    @ReactProp(name = "text")
    public void setText(ReactAztecText view, ReadableMap inputMap) {
        if (inputMap.hasKey(LINK_TEXT_COLOR_KEY)) {
            int color = Color.parseColor(inputMap.getString(LINK_TEXT_COLOR_KEY));
            setLinkTextColor(view, color);
        }

        if (!inputMap.hasKey("eventCount")) {
            setTextfromJS(view, inputMap.getString("text"), inputMap.getMap("selection"));
        } else {
            // Don't think there is necessity of this branch, but justin case we want to
            // force a 2nd setText from JS side to Native, just set a high eventCount
            int eventCount = inputMap.getInt("eventCount");

            if (view.getEventCounter() < eventCount) {
                view.setEventCounterSyncFromJS(eventCount);
                setTextfromJS(view, inputMap.getString("text"), inputMap.getMap("selection"));
            }
        }
    }

    private void setTextfromJS(ReactAztecText view, String text, @Nullable ReadableMap selection) {
        view.setIsSettingTextFromJS(true);
        view.disableOnSelectionListener();
        view.fromHtml(text, true);
        view.enableOnSelectionListener();
        view.setIsSettingTextFromJS(false);
        updateSelectionIfNeeded(view, selection);
    }

    private void updateSelectionIfNeeded(ReactAztecText view, @Nullable ReadableMap selection) {
        if ( selection != null ) {
            int start = selection.getInt("start");
            int end = selection.getInt("end");
            int textLength = view.getText().length();
            boolean startAndEndAreValid = start >= 0 &&
                                          end >= 0 &&
                                          start <= textLength &&
                                          end <= textLength;
            if (startAndEndAreValid) {
                view.setSelection(start, end);
            } else {
                // Calling view.setSelection would have thrown an exception, so let's send information about
                // what happened to help us figure out how we got into a bad state.
                try {
                    IllegalSelectionIndexException customException =
                            new IllegalSelectionIndexException(start, end, textLength, view);
                    customException.printStackTrace();
                    if (exceptionLogger != null) {
                        exceptionLogger.accept(customException);
                    }
                    if (breadcrumbLogger != null) {
                        breadcrumbLogger.accept(customException.getMessage());
                    }
                } catch (Exception e) {
                    // Should never happen, but if it does don't let logging cause a crash
                    e.printStackTrace();
                }
            }
        }
    }

    private boolean isHeadingBlock(ReactAztecText view) {
        String tag = view.getTagName();
        final String regex = "h([1-6])";
        final Pattern pattern = Pattern.compile(regex);
        final Matcher matcher = pattern.matcher(tag);

        return matcher.find();
    }

    private float getHeadingScale(String scale) {
        // Values from https://github.com/wordpress-mobile/AztecEditor-Android/blob/trunk/aztec/src/main/kotlin/org/wordpress/aztec/spans/AztecHeadingSpan.kt#L94-L100
        switch (scale) {
            case "h1":
                return 1.73f;
            case "h2":
                return 1.32f;
            case "h3":
                return 1.02f;
            case "h4":
                return 0.87f;
            case "h5":
                return 0.72f;
            case "h6":
                return 0.60f;
        }

        return 1.0f;
    }

    @ReactProp(name = "activeFormats", defaultBoolean = false)
    public void setActiveFormats(final ReactAztecText view, @Nullable ReadableArray activeFormats) {
        if (activeFormats != null) {
            String[] activeFormatsArray = new String[activeFormats.size()];
            for (int i = 0; i < activeFormats.size(); i++) {
                activeFormatsArray[i] = activeFormats.getString(i);
            }
            view.setActiveFormats(Arrays.asList(activeFormatsArray));
        } else {
            view.setActiveFormats(new ArrayList<String>());
        }
    }

    /*
     The code below was taken from the class ReactTextInputManager
     */
    @ReactProp(name = ViewProps.FONT_SIZE, defaultFloat = ViewDefaults.FONT_SIZE_SP)
    public void setFontSize(ReactAztecText view, float fontSize) {
        float scale = 1;
        boolean isLineHeightSet = mCurrentLineHeight != 0;
        mCurrentFontSize = fontSize;

        // Since Aztec applies a scale to the heading's font size
        // we subtract it before applying the new font size.
        if (isHeadingBlock(view) && isLineHeightSet) {
            scale = getHeadingScale(view.getTagName());
        }

        view.setTextSize(
                TypedValue.COMPLEX_UNIT_PX,
                (int) Math.ceil(PixelUtil.toPixelFromSP(fontSize / scale)));

        if (isLineHeightSet) {
            setLineHeight(view, mCurrentLineHeight);
        }
    }

    @ReactProp(name = ViewProps.LINE_HEIGHT)
    public void setLineHeight(ReactAztecText view, float lineHeight) {
        mCurrentLineHeight = lineHeight;
        float scale = 1;

        if (isHeadingBlock(view)) {
            scale = getHeadingScale(view.getTagName());
        }

        float textSize = view.getTextSize() * scale;
        view.setLineSpacing(textSize * lineHeight, (float) (lineHeight / textSize));
    }

    @ReactProp(name = ViewProps.FONT_FAMILY)
    public void setFontFamily(ReactAztecText view, String fontFamily) {
        int style = Typeface.NORMAL;
        if (view.getTypeface() != null) {
            style = view.getTypeface().getStyle();
        }
        Typeface newTypeface = ReactFontManager.getInstance().getTypeface(
                fontFamily,
                style,
                view.getContext().getAssets());
        view.setTypeface(newTypeface);
    }

    /**
     /* This code was taken from the method setFontWeight of the class ReactTextShadowNode
     /* TODO: Factor into a common place they can both use
     */
    @ReactProp(name = ViewProps.FONT_WEIGHT)
    public void setFontWeight(ReactAztecText view, @Nullable String fontWeightString) {
        int fontWeightNumeric = fontWeightString != null ?
                parseNumericFontWeight(fontWeightString) : -1;
        int fontWeight = UNSET;
        if (fontWeightNumeric >= 500 || "bold".equals(fontWeightString)) {
            fontWeight = Typeface.BOLD;
        } else if ("normal".equals(fontWeightString) ||
                (fontWeightNumeric != -1 && fontWeightNumeric < 500)) {
            fontWeight = Typeface.NORMAL;
        }
        Typeface currentTypeface = view.getTypeface();
        if (currentTypeface == null) {
            currentTypeface = Typeface.DEFAULT;
        }
        if (fontWeight != currentTypeface.getStyle()) {
            view.setTypeface(currentTypeface, fontWeight);
        }
    }

    /**
     /* This code was taken from the method setFontStyle of the class ReactTextShadowNode
     /* TODO: Factor into a common place they can both use
     */
    @ReactProp(name = ViewProps.FONT_STYLE)
    public void setFontStyle(ReactAztecText view, @Nullable String fontStyleString) {
        int fontStyle = UNSET;
        if ("italic".equals(fontStyleString)) {
            fontStyle = Typeface.ITALIC;
        } else if ("normal".equals(fontStyleString)) {
            fontStyle = Typeface.NORMAL;
        }

        Typeface currentTypeface = view.getTypeface();
        if (currentTypeface == null) {
            currentTypeface = Typeface.DEFAULT;
        }
        if (fontStyle != currentTypeface.getStyle()) {
            view.setTypeface(currentTypeface, fontStyle);
        }
    }

    /**
     * This code was taken from the method parseNumericFontWeight of the class ReactTextShadowNode
     * TODO: Factor into a common place they can both use
     *
     * Return -1 if the input string is not a valid numeric fontWeight (100, 200, ..., 900), otherwise
     * return the weight.
     */
    private static int parseNumericFontWeight(String fontWeightString) {
        // This should be much faster than using regex to verify input and Integer.parseInt
        return fontWeightString.length() == 3 && fontWeightString.endsWith("00")
                && fontWeightString.charAt(0) <= '9' && fontWeightString.charAt(0) >= '1' ?
                100 * (fontWeightString.charAt(0) - '0') : -1;
    }

    /**
     * This method is based on {@link ReactTextInputManager#setTextAlign}. The only change made to that method is to
     * use {@link android.widget.TextView#setGravity} instead of a custom method that preserves vertical gravity
     * like the setGravityHorizontal method from {@link com.facebook.react.views.textinput.ReactEditText}. The
     * reason for this change was to simplify the code. Since we never set vertical gravity, we do not need to add
     * the complexity of preserving vertical gravity—we can just use {@link android.widget.TextView#setGravity}
     * directly.
     */
    @ReactProp(name = ViewProps.TEXT_ALIGN)
    public void setTextAlign(ReactAztecText view, @Nullable String textAlign) {
        if ("justify".equals(textAlign)) {
            /*
                JUSTIFICATION_MODE_XYZ constants were moved from Layout to LineBreaker in
                SDK 29. The values of the constants haven't changed, but Lint is complaining that we
                 can't use constants which were introduced in SDK 29 on older version. Separating
                  the calls into two methods per SDK version annotated with RequiresApi was the
                  only way how to make lint happy.
             */
            // Value is hardcoded because Lint is failing with a false positive "Unnecessary; SDK_INT is never < 21"
            if (Build.VERSION.SDK_INT >= 29) {
                setJustificationModeSdk29(view, LineBreaker.JUSTIFICATION_MODE_INTER_WORD);
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                setJustificationModeSDK26(view, Layout.JUSTIFICATION_MODE_INTER_WORD);
            }
            view.setGravity(Gravity.START);
        } else {
            // Value is hardcoded because Lint is failing with a false positive "Unnecessary; SDK_INT is never < 21"
            if (Build.VERSION.SDK_INT >= 29) {
                setJustificationModeSdk29(view, LineBreaker.JUSTIFICATION_MODE_NONE);
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                setJustificationModeSDK26(view, Layout.JUSTIFICATION_MODE_NONE);
            }

            if (textAlign == null || "auto".equals(textAlign)) {
                view.setGravity(Gravity.NO_GRAVITY);
            } else if ("left".equals(textAlign)) {
                view.setGravity(Gravity.START);
            } else if ("right".equals(textAlign)) {
                view.setGravity(Gravity.END);
            } else if ("center".equals(textAlign)) {
                view.setGravity(Gravity.CENTER_HORIZONTAL);
            } else {
                throw new JSApplicationIllegalArgumentException("Invalid textAlign: " + textAlign);
            }
        }
    }

    @RequiresApi(api = Build.VERSION_CODES.O)
    private void setJustificationModeSDK26(ReactAztecText view, int justificationModeInterWord) {
        view.setJustificationMode(justificationModeInterWord);
    }

    // Value is hardcoded because Lint is failing with a false positive "Unnecessary; SDK_INT is never < 21"
    @RequiresApi(api = 29)
    private void setJustificationModeSdk29(ReactAztecText view, int justificationModeInterWord) {
        view.setJustificationMode(justificationModeInterWord);
    }

    private void setLinkTextColor(ReactAztecText view, @Nullable Integer color) {
        if (color != null && view.linkFormatter.getLinkStyle().getLinkColor() != color) {
            view.setLinkFormatter(new LinkFormatter(view,
                    new LinkFormatter.LinkStyle(
                            color, true)
            ));
        }
    }

    /* End of the code taken from ReactTextInputManager */

    @ReactProp(name = "color", customType = "Color")
    public void setColor(ReactAztecText view, @Nullable Integer color) {
        int newColor = Color.BLACK;
        if (color != null) {
            newColor = color;
        }
        view.setTextColor(newColor);
    }

    @ReactProp(name = "selectionColor", customType = "Color")
    public void setSelectionColor(ReactAztecText view, @Nullable Integer color) {
        if (color != null) {
            view.setHighlightColor(ColorUtils.setAlphaComponent(color, 51));
            view.setCursorColor(color);
        }
    }

    @ReactProp(name = "blockType")
    public void setBlockType(ReactAztecText view, ReadableMap inputMap) {
        if (inputMap.hasKey(BLOCK_TYPE_TAG_KEY)) {
            view.setTagName(inputMap.getString(BLOCK_TYPE_TAG_KEY));

            // Check if it's a heading block, this is needed to set the
            // right font size scale.
            if (isHeadingBlock(view)) {
                setFontSize(view, mCurrentFontSize);
            }
        }
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

    /*
     * This property/method is used to disable the Gutenberg compatibility mode on AztecRN.
     *
     * Aztec comes along with some nice plugins that are able to show preview of Pictures/Videos/shortcodes,
     * and WP specific features, in the visual editor.
     *
     * We don't need those improvements in Gutenberg mobile, so this RN wrapper around Aztec
     * that's only used in GB-mobile at the moment, does have them OFF by default.
     *
     * An external 3rd party RN-app can use AztecRN wrapper and set the `disableGutenbergMode` to false to have a fully
     * working visual editor. See the demo app, where `disableGutenbergMode` is already OFF.
     */
    @ReactProp(name = "disableGutenbergMode", defaultBoolean = false)
    public void disableGBMode(final ReactAztecText view, boolean disable) {
        if (disable) {
            view.addPlugin(new WordPressCommentsPlugin(view));
            view.addPlugin(new MoreToolbarButton(view));
            view.addPlugin(new CaptionShortcodePlugin(view));
            view.addPlugin(new VideoShortcodePlugin());
            view.addPlugin(new AudioShortcodePlugin());
            view.addPlugin(new HiddenGutenbergPlugin(view));
            view.setImageGetter(new GlideImageLoader(view.getContext()));
            view.setVideoThumbnailGetter(new GlideVideoThumbnailLoader(view.getContext()));
            // we need to restart the editor now
            String content = view.toHtml(view.getText(), false);
            view.fromHtml(content, false);
        }
    }

    @ReactProp(name = "onContentSizeChange", defaultBoolean = false)
    public void setOnContentSizeChange(final ReactAztecText view, boolean onContentSizeChange) {
        if (onContentSizeChange) {
            view.setContentSizeWatcher(new AztecContentSizeWatcher(view));
        } else {
            view.setContentSizeWatcher(null);
        }
    }

    @ReactProp(name = "onSelectionChange", defaultBoolean = false)
    public void setOnSelectionChange(final ReactAztecText view, boolean onSelectionChange) {
        view.shouldHandleOnSelectionChange = onSelectionChange;
    }

    @ReactProp(name = "onScroll", defaultBoolean = false)
    public void setOnScroll(final ReactAztecText view, boolean onScroll) {
        if (onScroll) {
            view.setScrollWatcher(new AztecScrollWatcher(view));
        } else {
            view.setScrollWatcher(null);
        }
    }

    @ReactProp(name = "onEnter", defaultBoolean = false)
    public void setOnEnterHandling(final ReactAztecText view, boolean onEnterHandling) {
        view.shouldHandleOnEnter = onEnterHandling;
    }

    @ReactProp(name = "onBackspace", defaultBoolean = false)
    public void setOnBackspaceHandling(final ReactAztecText view, boolean onBackspaceHandling) {
        view.shouldHandleOnBackspace = onBackspaceHandling;
    }

    @ReactProp(name = "onPaste", defaultBoolean = false)
    public void setOnPasteHandling(final ReactAztecText view, boolean onPasteHandling) {
        view.shouldHandleOnPaste = onPasteHandling;
    }

    @ReactProp(name = "deleteEnter", defaultBoolean = false)
    public void setShouldDeleteEnter(final ReactAztecText view, boolean shouldDeleteEnter) {
        view.shouldDeleteEnter = shouldDeleteEnter;
    }

    @Override
    public Map<String, Integer> getCommandsMap() {
        return MapBuilder.<String, Integer>builder()
                .put("focusTextInput", mFocusTextInputCommandCode)
                .put("blurTextInput", mBlurTextInputCommandCode)
                .build();
    }

    @Override
    public void receiveCommand(final ReactAztecText parent, String commandType, @Nullable ReadableArray args) {
        Assertions.assertNotNull(parent);
        if (commandType.equals("focus")) {
            // schedule a request to focus in the next layout, to fix https://github.com/wordpress-mobile/gutenberg-mobile/issues/1870
            new Handler(Looper.getMainLooper()).post(new Runnable() {
                @Override
                public void run() {
                    parent.requestFocusFromJS();
                }
            });
            return;
        } else if (commandType.equals("blur")) {
            parent.clearFocusFromJS();
            return;
        }
        super.receiveCommand(parent, commandType, args);
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
                                            editText.toHtml(editText.getText(), false)));
                        }
                    }
                });

        // Don't think we need to add setOnEditorActionListener here (intercept Enter for example), but
        // in case check ReactTextInputManager
    }

    @Override
    public void updateExtraData(ReactAztecText view, Object extraData) {
        if (extraData instanceof ReactTextUpdate) {
            ReactTextUpdate update = (ReactTextUpdate) extraData;

            view.setPadding(
                    (int) update.getPaddingLeft(),
                    (int) update.getPaddingTop(),
                    (int) update.getPaddingRight(),
                    (int) update.getPaddingBottom());
        }
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

            // if the "Enter" handling is underway, don't sent text change events. The ReactAztecEnterEvent will have
            // the text (minus the Enter char itself).
            if (!mEditText.isEnterPressedUnderway()) {
                int currentEventCount = mEditText.incrementAndGetEventCounter();
                boolean singleCharacterHasBeenAdded = count - before == 1;
                // The event that contains the event counter and updates it must be sent first.
                // TODO: t7936714 merge these events
                mEventDispatcher.dispatchEvent(
                        new AztecReactTextChangedEvent(
                                mEditText.getId(),
                                mEditText.toHtml(mEditText.getText(), false),
                                currentEventCount,
                                singleCharacterHasBeenAdded ? s.charAt(start + before) : null));

                mEventDispatcher.dispatchEvent(
                        new ReactTextInputEvent(
                                mEditText.getId(),
                                newText,
                                oldText,
                                start,
                                start + before));
            }


            if (mPreviousText.length() == 0
                    && !isTextEmpty(newText)
                    && !TextUtils.isEmpty(mEditText.getTagName())
                    && mEditText.getSelectedStyles().isEmpty()) {

                // Some block types (e.g. header block ) need to be created with default style  (e.g. h2)
                // In order to achieve that, we need to toggle formatting with proper style,
                // otherwise header block won't be created with style, it will be presented as plain text
                ReactAztecTextFormatEnum reactAztecTextFormat = ReactAztecTextFormatEnum.get(mEditText.getTagName());
                if (reactAztecTextFormat != null) {
                    mEditText.toggleFormatting(reactAztecTextFormat.getAztecTextFormat());
                }
            }
        }

        // This accounts for the END_OF_BUFFER_MARKER that is added to blocks to maintain the styling, if the only char
        // is the zero width marker then it is considered "empty"
        private boolean isTextEmpty(String text) {
            return text.length() == 0 || (text.length() == 1 && text.charAt(0) == Constants.INSTANCE.getEND_OF_BUFFER_MARKER());
        }

        @Override
        public void afterTextChanged(Editable s) {}
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
