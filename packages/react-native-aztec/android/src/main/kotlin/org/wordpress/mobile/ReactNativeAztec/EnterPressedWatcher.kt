package org.wordpress.mobile.ReactNativeAztec

import android.text.Editable
import android.text.SpannableStringBuilder
import android.text.Spanned
import android.text.TextWatcher
import org.wordpress.aztec.AztecText
import org.wordpress.aztec.Constants
import java.lang.ref.WeakReference

// Class to be used as a span to temporarily denote that Enter was detected
class EnterPressedUnderway

interface EnterDeleter {
    fun shouldDeleteEnter(): Boolean
}

class EnterPressedWatcher(aztecText: AztecText, var enterDeleter: EnterDeleter) : TextWatcher {

    private val aztecTextRef: WeakReference<AztecText?> = WeakReference(aztecText)
    private lateinit var textBefore: SpannableStringBuilder
    private var start: Int = -1
    private var selStart: Int = 0
    private var selEnd: Int = 0
    var done = false

    override fun beforeTextChanged(text: CharSequence, start: Int, count: Int, after: Int) {
        val aztecText = aztecTextRef.get()
        if (aztecText?.getAztecKeyListener() != null && !aztecText.isTextChangedListenerDisabled()) {
            // we need to make a copy to preserve the contents as they were before the change
            textBefore = SpannableStringBuilder(text)
            this.start = start
            this.selStart = aztecText.selectionStart
            this.selEnd = aztecText.selectionEnd
        }
    }

    override fun onTextChanged(text: CharSequence, start: Int, before: Int, count: Int) {
        val aztecText = aztecTextRef.get()
        val aztecKeyListener = aztecText?.getAztecKeyListener()
        if (aztecText != null && !aztecText.isTextChangedListenerDisabled() && aztecKeyListener != null) {
            val newTextCopy = SpannableStringBuilder(text)
            // if new text length is longer than original text by 1
            if (textBefore?.length == newTextCopy.length - 1) {
                // now check that the inserted character is actually a NEWLINE
                val enterPosition = newTextCopy.lastIndexOf(Constants.NEWLINE)
                if (-1 < enterPosition) {
                    done = false
                    aztecText.editableText.setSpan(EnterPressedUnderway(), enterPosition,
                            enterPosition, Spanned.SPAN_USER)
                    aztecKeyListener.onEnterKey(
                            newTextCopy.replace(enterPosition, enterPosition + 1, ""),
                            true,
                            selStart,
                            selEnd
                    )
                }
            }
        }
    }

    override fun afterTextChanged(text: Editable) {
        aztecTextRef.get()?.editableText?.getSpans(0, text.length,
                EnterPressedUnderway::class.java)?.forEach { it ->
            if (!done) {
                done = true
                if (enterDeleter.shouldDeleteEnter()) {
                    val enterStart = text.getSpanStart(it)
                    text.replace(enterStart, enterStart + 1, "")
                }
            }
            aztecTextRef.get()?.editableText?.removeSpan(it)
        }
    }

    companion object {
        fun isEnterPressedUnderway(spanned: Spanned?): Boolean {
            return spanned?.getSpans(0, 0, EnterPressedUnderway::class.java)?.isNotEmpty() ?: false
        }
    }
}
