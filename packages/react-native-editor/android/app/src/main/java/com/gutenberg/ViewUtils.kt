package com.gutenberg

import android.content.Context
import android.graphics.Rect
import android.view.TouchDelegate
import android.view.View
import android.view.ViewTreeObserver
import android.view.inputmethod.InputMethodManager
import androidx.annotation.DimenRes
import androidx.recyclerview.widget.RecyclerView
import androidx.recyclerview.widget.SimpleItemAnimator

fun View.setVisible(visible: Boolean) {
    this.visibility = if (visible) View.VISIBLE else View.GONE
}
//
//fun View.redirectContextClickToLongPressListener() {
//    this.setOnContextClickListener { it.performLongClick() }
//}

fun View.expandTouchTargetArea(@DimenRes dimenRes: Int, heightOnly: Boolean = false) {
    val pixels = context.resources.getDimensionPixelSize(dimenRes)
    val parent = this.parent as View

    parent.post {
        val touchTargetRect = Rect()
        getHitRect(touchTargetRect)
        touchTargetRect.top -= pixels
        touchTargetRect.bottom += pixels

        if (!heightOnly) {
            touchTargetRect.right += pixels
            touchTargetRect.left -= pixels
        }

        parent.touchDelegate = TouchDelegate(touchTargetRect, this)
    }
}

/**
 * Ensures that the keyboard is only shown when the view has received focused.
 *
 * https://developer.squareup.com/blog/showing-the-android-keyboard-reliably/
 */
fun View.focusAndShowKeyboard() {
    /**
     * This is to be called when the window already has focus.
     */
    fun View.showTheKeyboardNow() {
        if (isFocused) {
            post {
                // We still post the call, just in case we are being notified of the windows focus
                // but InputMethodManager didn't get properly setup yet.
                val imm = context.getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
                imm.showSoftInput(this, InputMethodManager.SHOW_IMPLICIT)
            }
        }
    }

    requestFocus()
    if (hasWindowFocus()) {
        // No need to wait for the window to get focus.
        showTheKeyboardNow()
    } else {
        // We need to wait until the window gets focus.
        viewTreeObserver.addOnWindowFocusChangeListener(
                object : ViewTreeObserver.OnWindowFocusChangeListener {
                    override fun onWindowFocusChanged(hasFocus: Boolean) {
                        // This notification will arrive just before the InputMethodManager gets set up.
                        if (hasFocus) {
                            this@focusAndShowKeyboard.showTheKeyboardNow()
                            // It’s very important to remove this listener once we are done.
                            viewTreeObserver.removeOnWindowFocusChangeListener(this)
                        }
                    }
                })
    }
}

fun RecyclerView.disableAnimation() {
    (itemAnimator as? SimpleItemAnimator)?.supportsChangeAnimations = false
}
