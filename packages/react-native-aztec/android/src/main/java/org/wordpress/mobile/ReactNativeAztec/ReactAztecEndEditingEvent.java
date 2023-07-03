package org.wordpress.mobile.ReactNativeAztec;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.RCTEventEmitter;

/**
 * Event emitted by AztecText native view when text editing ends,
 * because of the user leaving the text input.
 */
class ReactAztecEndEditingEvent extends Event<ReactAztecEndEditingEvent> {

  private static final String EVENT_NAME = "topEndEditing";

  private String mText;

  public ReactAztecEndEditingEvent(
      int viewId,
      String text) {
    super(viewId);
    mText = text;
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
    eventData.putString("text", mText);
    return eventData;
  }
}
