package org.wordpress.mobile.ReactNativeAztec;

import android.support.annotation.Nullable;
import android.text.Editable;
import android.text.TextWatcher;

import com.facebook.react.bridge.ReactContext;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.views.textinput.ContentSizeWatcher;
import com.facebook.react.views.textinput.ReactTextInputLocalData;
import com.facebook.react.views.textinput.ScrollWatcher;

import org.wordpress.aztec.AztecText;
import org.wordpress.aztec.glideloader.GlideImageLoader;
import org.wordpress.aztec.glideloader.GlideVideoThumbnailLoader;
import org.wordpress.aztec.plugins.CssUnderlinePlugin;
import org.wordpress.aztec.plugins.IAztecPlugin;
import org.wordpress.aztec.plugins.IToolbarButton;
import org.wordpress.aztec.plugins.shortcodes.AudioShortcodePlugin;
import org.wordpress.aztec.plugins.shortcodes.CaptionShortcodePlugin;
import org.wordpress.aztec.plugins.shortcodes.VideoShortcodePlugin;
import org.wordpress.aztec.plugins.wpcomments.HiddenGutenbergPlugin;
import org.wordpress.aztec.plugins.wpcomments.WordPressCommentsPlugin;
import org.wordpress.aztec.plugins.wpcomments.toolbar.MoreToolbarButton;

import java.util.ArrayList;

public class ReactAztecText extends AztecText {

    // This flag is set to true when we set the text of the EditText explicitly. In that case, no
    // *TextChanged events should be triggered. This is less expensive than removing the text
    // listeners and adding them back again after the text change is completed.
    private boolean mIsSettingTextFromJS = false;
    private @Nullable ArrayList<TextWatcher> mListeners;
    private @Nullable TextWatcherDelegator mTextWatcherDelegator;
    private @Nullable ContentSizeWatcher mContentSizeWatcher;
    private @Nullable ScrollWatcher mScrollWatcher;

    // FIXME: Used in `incrementAndGetEventCounter` but never read. I guess we can get rid of it, but before this
    // check when it's used in EditText in RN. (maybe tests?)
    int mNativeEventCount = 0;

    public ReactAztecText(ThemedReactContext reactContext) {
        super(reactContext);
        this.setFocusableInTouchMode(true);
        this.setFocusable(true);

        addPlugin(new WordPressCommentsPlugin(this));
        addPlugin(new MoreToolbarButton(this));
        addPlugin(new CaptionShortcodePlugin(this));
        addPlugin(new VideoShortcodePlugin());
        addPlugin(new AudioShortcodePlugin());
        addPlugin(new HiddenGutenbergPlugin(this));
        addPlugin(new CssUnderlinePlugin());
        this.setImageGetter(new GlideImageLoader(reactContext));
        this.setVideoThumbnailGetter(new GlideVideoThumbnailLoader(reactContext));
    }

    @Override
    public void refreshText() {
        super.refreshText();
        onContentSizeChange();
    }

    private void addPlugin(IAztecPlugin plugin) {
        super.getPlugins().add(plugin);
        if (plugin instanceof IToolbarButton && getToolbar() != null ) {
            getToolbar().addButton((IToolbarButton)plugin);
        }
    }

    public void setScrollWatcher(ScrollWatcher scrollWatcher) {
        mScrollWatcher = scrollWatcher;
    }

    @Override
    protected void onScrollChanged(int horiz, int vert, int oldHoriz, int oldVert) {
        super.onScrollChanged(horiz, vert, oldHoriz, oldVert);

        if (mScrollWatcher != null) {
            mScrollWatcher.onScrollChanged(horiz, vert, oldHoriz, oldVert);
        }
    }

    public void setContentSizeWatcher(ContentSizeWatcher contentSizeWatcher) {
        mContentSizeWatcher = contentSizeWatcher;
    }

    private void onContentSizeChange() {
        if (mContentSizeWatcher != null) {
            mContentSizeWatcher.onLayout();
        }

        setIntrinsicContentSize();
    }

    // After the text changes inside an EditText, TextView checks if a layout() has been requested.
    // If it has, it will not scroll the text to the end of the new text inserted, but wait for the
    // next layout() to be called. However, we do not perform a layout() after a requestLayout(), so
    // we need to override isLayoutRequested to force EditText to scroll to the end of the new text
    // immediately.
    // TODO: t6408636 verify if we should schedule a layout after a View does a requestLayout()
    @Override
    public boolean isLayoutRequested() {
        return false;
    }

    @Override
    protected void onLayout(boolean changed, int left, int top, int right, int bottom) {
        onContentSizeChange();
    }

    private void setIntrinsicContentSize() {
        ReactContext reactContext = (ReactContext) getContext();
        UIManagerModule uiManager = reactContext.getNativeModule(UIManagerModule.class);
        final ReactTextInputLocalData localData = new ReactTextInputLocalData(this);
        uiManager.setViewLocalData(getId(), localData);
    }

    //// Text changed events

    public int incrementAndGetEventCounter() {
        return ++mNativeEventCount;
    }

    @Override
    public void addTextChangedListener(TextWatcher watcher) {
        if (mListeners == null) {
            mListeners = new ArrayList<>();
            super.addTextChangedListener(getTextWatcherDelegator());
        }

        mListeners.add(watcher);
    }

    @Override
    public void removeTextChangedListener(TextWatcher watcher) {
        if (mListeners != null) {
            mListeners.remove(watcher);

            if (mListeners.isEmpty()) {
                mListeners = null;
                super.removeTextChangedListener(getTextWatcherDelegator());
            }
        }
    }

    private TextWatcherDelegator getTextWatcherDelegator() {
        if (mTextWatcherDelegator == null) {
            mTextWatcherDelegator = new TextWatcherDelegator();
        }
        return mTextWatcherDelegator;
    }

    public void setIsSettingTextFromJS(boolean mIsSettingTextFromJS) {
        this.mIsSettingTextFromJS = mIsSettingTextFromJS;
    }

    /**
     * This class will redirect *TextChanged calls to the listeners only in the case where the text
     * is changed by the user, and not explicitly set by JS.
     */
    private class TextWatcherDelegator implements TextWatcher {
        @Override
        public void beforeTextChanged(CharSequence s, int start, int count, int after) {
            if (!mIsSettingTextFromJS && mListeners != null) {
                for (TextWatcher listener : mListeners) {
                    listener.beforeTextChanged(s, start, count, after);
                }
            }
        }

        @Override
        public void onTextChanged(CharSequence s, int start, int before, int count) {
            if (!mIsSettingTextFromJS && mListeners != null) {
                for (TextWatcher listener : mListeners) {
                    listener.onTextChanged(s, start, before, count);
                }
            }

            onContentSizeChange();
        }

        @Override
        public void afterTextChanged(Editable s) {
            if (!mIsSettingTextFromJS && mListeners != null) {
                for (TextWatcher listener : mListeners) {
                    listener.afterTextChanged(s);
                }
            }
        }
    }
}
