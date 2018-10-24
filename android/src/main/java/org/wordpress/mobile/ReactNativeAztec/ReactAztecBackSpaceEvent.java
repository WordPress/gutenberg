package org.wordpress.mobile.ReactNativeAztec;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.RCTEventEmitter;

/**
 * Event emitted by Aztec native view when BackSpace is detected.
 */
class ReactAztecBackSpaceEvent extends Event<ReactAztecBackSpaceEvent> {

  private static final String EVENT_NAME = "topTextInputBackspace";

  private String mText;
  private int mSelectionStart;
  private int mSelectionEnd;

  public ReactAztecBackSpaceEvent(int viewId, String text, int selectionStart, int selectionEnd) {
    super(viewId);
    mText = text;
    mSelectionStart = selectionStart;
    mSelectionEnd = selectionEnd;
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
    eventData.putInt("selectionStart", mSelectionStart);
    eventData.putInt("selectionEnd", mSelectionEnd);
    return eventData;
  }
}
