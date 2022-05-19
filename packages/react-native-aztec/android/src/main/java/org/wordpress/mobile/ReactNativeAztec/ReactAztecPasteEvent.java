package org.wordpress.mobile.ReactNativeAztec;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.RCTEventEmitter;

/**
 * Event emitted by Aztec native view when paste is detected.
 */
class ReactAztecPasteEvent extends Event<ReactAztecPasteEvent> {

    private static final String EVENT_NAME = "topTextInputPaste";

    private String mCurrentContent;
    private int mSelectionStart;
    private int mSelectionEnd;
    private String mPastedText;
    private String mPastedHtml;

    public ReactAztecPasteEvent(int viewId, String currentContent, int selectionStart,
                                int selectionEnd, String pastedText, String pastedHtml) {
        super(viewId);
        mCurrentContent = currentContent;
        mSelectionStart = selectionStart;
        mSelectionEnd = selectionEnd;
        mPastedText = pastedText;
        mPastedHtml = pastedHtml;
    }

    @Override
    public String getEventName() {
        return EVENT_NAME;
    }

    @Override
    public boolean canCoalesce() {
        return false;
    }

    @Override
    public void dispatch(RCTEventEmitter rctEventEmitter) {
        rctEventEmitter.receiveEvent(getViewTag(), getEventName(), serializeEventData());
    }

    private WritableMap serializeEventData() {
        WritableMap eventData = Arguments.createMap();
        eventData.putInt("target", getViewTag());
        eventData.putString("currentContent", mCurrentContent);
        eventData.putInt("selectionStart", mSelectionStart);
        eventData.putInt("selectionEnd", mSelectionEnd);
        eventData.putString("pastedText", mPastedText);
        eventData.putString("pastedHtml", mPastedHtml);
        return eventData;
    }
}
