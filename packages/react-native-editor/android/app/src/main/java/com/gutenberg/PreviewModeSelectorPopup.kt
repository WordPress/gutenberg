package com.gutenberg

import android.content.Context
import android.graphics.drawable.ColorDrawable
import android.view.Gravity
import android.view.View
import androidx.appcompat.widget.ListPopupWindow
import com.google.android.material.elevation.ElevationOverlayProvider
import com.gutenberg.R.dimen

/**
 * Implements the preview mode popup
 */
class PreviewModeSelectorPopup(val context: Context, val button: View) : ListPopupWindow(context) {
    init {
        val resources = context.resources
        val popupOffset = resources.getDimensionPixelSize(dimen.margin_extra_large)
        width = resources.getDimensionPixelSize(dimen.web_preview_mode_popup_width)
        setDropDownGravity(Gravity.END)
        anchorView = button
        horizontalOffset = -popupOffset
        verticalOffset = popupOffset
        isModal = true
        val popupBackgroundColor = ElevationOverlayProvider(context).compositeOverlayWithThemeSurfaceColorIfNeeded(
                resources.getDimension(dimen.popup_over_toolbar_elevation)
        )
        setBackgroundDrawable(ColorDrawable(popupBackgroundColor))
    }

    fun show(handler: PreviewModeHandler) {
        button.post(Runnable {
            setAdapter(PreviewModeMenuAdapter(context, handler.selectedPreviewMode()))
            setOnItemClickListener { parent, _, position, _ ->
                dismiss()
                val adapter = parent.adapter as PreviewModeMenuAdapter
                val selected = adapter.getItem(position)
                if (selected !== handler.selectedPreviewMode()) {
                    handler.onPreviewModeChanged(selected)
                }
            }
            show()
        })
    }
}
