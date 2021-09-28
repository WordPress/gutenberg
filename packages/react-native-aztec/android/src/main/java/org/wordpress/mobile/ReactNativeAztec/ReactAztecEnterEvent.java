package org.wordpress.mobile.ReactNativeAztec;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.RCTEventEmitter;

/**
 * Event emitted by Aztec native view when KEYCODE_ENTER is detected.
 */
class ReactAztecEnterEvent extends Event<ReactAztecEnterEvent> {

  private static final String EVENT_NAME = "topTextInputEnter";

  private String mText;
  private int mSelectionStart;
  private int mSelectionEnd;
  private boolean mFiredAfterTextChanged;
  private int mEventCount;

  public ReactAztecEnterEvent(int viewId, String text, int selectionStart, int selectionEnd,
          boolean firedAfterTextChanged, int eventCount) {
    super(viewId);
    mText = text;
    mSelectionStart = selectionStart;
    mSelectionEnd = selectionEnd;
    mFiredAfterTextChanged = firedAfterTextChanged;
    mEventCount = eventCount;
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
    eventData.putBoolean("firedAfterTextChanged", mFiredAfterTextChanged);
    eventData.putInt("eventCount", mEventCount);
    return eventData;
  }
}
