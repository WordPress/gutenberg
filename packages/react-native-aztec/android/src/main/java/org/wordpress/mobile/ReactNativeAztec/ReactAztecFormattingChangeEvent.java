package org.wordpress.mobile.ReactNativeAztec;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.RCTEventEmitter;

/**
 * Event emitted by Aztec native view when it receives focus.
 */
class ReactAztecFormattingChangeEvent extends Event<ReactAztecFormattingChangeEvent> {

    private static final String EVENT_NAME = "topFormatsChanges";

    private String[] mFormats;

    public ReactAztecFormattingChangeEvent(int viewId, String[] formats) {
        super(viewId);
        this.mFormats = formats;
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
        WritableArray newFormats = Arguments.fromArray(mFormats);
        eventData.putArray("formats", newFormats);
        return eventData;
    }
}
