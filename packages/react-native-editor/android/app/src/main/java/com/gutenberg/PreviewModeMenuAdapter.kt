package com.gutenberg

import android.content.Context
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.BaseAdapter
import android.widget.ImageView
import android.widget.TextView

import com.gutenberg.R.dimen
import com.gutenberg.PreviewMode.DESKTOP
import com.gutenberg.PreviewMode.MOBILE
import com.gutenberg.PreviewMode.TABLET
import com.gutenberg.setVisible

/**
 * Implements the preview/thumbnail mode popup adapter
 */
class PreviewModeMenuAdapter(context: Context, private val selectedPreviewMode: PreviewMode) : BaseAdapter() {
    private val inflater: LayoutInflater = LayoutInflater.from(context)
    private val menuItems = arrayOf(PreviewMode.MOBILE, TABLET, DESKTOP)

    override fun getCount() = menuItems.size

    override fun getItem(position: Int): PreviewMode = menuItems[position]

    override fun getItemId(position: Int): Long = position.toLong()

    override fun getView(position: Int, convertView: View?, parent: ViewGroup): View? {
        var view = convertView
        val holder: PreviewModeMenuHolder
        if (view == null) {
            view = inflater.inflate(R.layout.preview_mode_popup_menu_item, parent, false)
            holder = PreviewModeMenuHolder(view)
            view.tag = holder
        } else {
            holder = view.tag as PreviewModeMenuHolder
        }

        val previewMode = getItem(position)
        val labelResId = when (previewMode) {
            MOBILE -> R.string.web_preview_mobile
            TABLET -> R.string.web_preview_tablet
            DESKTOP -> R.string.web_preview_desktop
        }

        holder.label.setText(labelResId)
        holder.checkMark.setVisible(previewMode === selectedPreviewMode)

        return view
    }

    internal inner class PreviewModeMenuHolder(view: View) {
        val label: TextView = view.findViewById(R.id.preview_mode_label)
        val checkMark: ImageView = view.findViewById(R.id.checkmark)
    }
}
