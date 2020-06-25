package org.wordpress.mobile.ReactNativeAztec

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.RCTEventEmitter

/**
 * This event includes all data contained in [com.facebook.react.views.textinput.ReactTextChangedEvent],
 * plus some extra info Gutenberg needs from Aztec.
 */
class AztecReactTextChangedEvent(
    viewId: Int,
    private val mText: String,
    private val mEventCount: Int,
    private val mMostRecentChar: Char?
) : Event<AztecReactTextChangedEvent>(viewId) {

    override fun getEventName(): String = "topAztecChange"

    override fun dispatch(rctEventEmitter: RCTEventEmitter) {
        rctEventEmitter.receiveEvent(viewTag, eventName, serializeEventData())
    }

    private fun serializeEventData(): WritableMap =
            Arguments.createMap().apply {
                putString("text", mText)
                putInt("eventCount", mEventCount)
                putInt("target", viewTag)
                if (mMostRecentChar != null) {
                    putInt("keyCode", mMostRecentChar.toInt())
                }
            }
}
