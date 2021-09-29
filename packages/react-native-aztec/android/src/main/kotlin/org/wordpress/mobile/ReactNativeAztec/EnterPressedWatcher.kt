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

    private var gboardReplacement: CharSequence? = null


    override fun beforeTextChanged(text: CharSequence, start: Int, count: Int, after: Int) {
        val aztecText = aztecTextRef.get()
        if (aztecText?.getAztecKeyListener() != null && !aztecText.isTextChangedListenerDisabled()) {
            // we need to make a copy to preserve the contents as they were before the change
            textBefore = SpannableStringBuilder(text)
            this.start = start
            this.selStart = aztecText.selectionStart
            this.selEnd = aztecText.selectionEnd

            if (selStart == selEnd && 0 < count && count < after) {
                // possible gboard replacement detected
                gboardReplacement = text.subSequence(start, start + count)
            } else {
                gboardReplacement = null
            }
        }
    }

    override fun onTextChanged(text: CharSequence, start: Int, before: Int, count: Int) {
        val aztecText = aztecTextRef.get()
        val aztecKeyListener = aztecText?.getAztecKeyListener()
        if (aztecText != null && !aztecText.isTextChangedListenerDisabled() && aztecKeyListener != null) {
            val newTextCopy = SpannableStringBuilder(text)

            var gboardOffset = this.start
            // If gboard replacement is happening, we offset the start position by the length
            // of the gboard replacement
            if (gboardReplacement != null) {
                val gboardRestored = newTextCopy.subSequence(start, start + before)
                if (gboardRestored.toString() == gboardReplacement.toString()) {
                    gboardOffset += gboardRestored.length
                }
            }

            // if new text length is longer than original text by 1
            if (textBefore?.length == newTextCopy.length - 1) {
                // now check that the inserted character is actually a NEWLINE
                if (newTextCopy[gboardOffset] == Constants.NEWLINE) {
                    done = false
                    aztecText.editableText.setSpan(EnterPressedUnderway(), 0, 0, Spanned.SPAN_USER)
                    aztecKeyListener.onEnterKey(
                            newTextCopy.replace(gboardOffset, gboardOffset + 1, ""),
                            true,
                            selStart,
                            selEnd
                    )
                }
            }
        }
    }

    override fun afterTextChanged(text: Editable) {
        aztecTextRef.get()?.editableText?.getSpans(0, 0, EnterPressedUnderway::class.java)?.forEach {
            if (!done) {
                done = true
                if (enterDeleter.shouldDeleteEnter()) {
                    var gboardOffset = start
                    gboardReplacement?.let { replacement -> gboardOffset += replacement.length }
                    text.replace(gboardOffset, gboardOffset + 1, "")
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
