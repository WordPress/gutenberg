package com.gutenberg

import android.app.Activity
import android.app.Application
import android.content.Context
import android.graphics.drawable.Drawable
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.fragment.app.FragmentActivity
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.bumptech.glide.load.DataSource
import com.bumptech.glide.load.engine.GlideException
import com.bumptech.glide.request.RequestListener
import com.bumptech.glide.request.target.Target
import com.gutenberg.databinding.ModalLayoutPickerLayoutsCardBinding

/**
 * Renders the Layout card
 */
class LayoutViewHolder(
    private val parent: ViewGroup,
    private val binding: ModalLayoutPickerLayoutsCardBinding
) : RecyclerView.ViewHolder(binding.root) {
    fun onBind(uiState: LayoutListItemUiState) {
        val context = binding.preview.context
        if (context.isAvailable()) {
            Glide.with(context)
                .load(uiState.preview)
                .fitCenter()
                .listener(object : RequestListener<Drawable> {
                    override fun onLoadFailed(
                        e: GlideException?,
                        model: Any?,
                        target: Target<Drawable>?,
                        isFirstResource: Boolean
                    ): Boolean {
                        return false
                    }

                    override fun onResourceReady(
                        resource: Drawable?,
                        model: Any?,
                        target: Target<Drawable>?,
                        dataSource: DataSource?,
                        isFirstResource: Boolean
                    ): Boolean {
                        uiState.onThumbnailReady.invoke()
                        return false
                    }
                })
                .into(binding.preview)
                .clearOnDetach()

        }
        binding.selectedOverlay.setVisible(uiState.selectedOverlayVisible)
        binding.preview.contentDescription = parent.context.getString(uiState.contentDescriptionResId, uiState.title)
        binding.preview.context?.let { ctx ->
            binding.layoutContainer.strokeWidth = if (uiState.selectedOverlayVisible) {
                ctx.resources.getDimensionPixelSize(R.dimen.picker_header_selection_overlay_width)
            } else {
                0
            }
        }
        binding.layoutContainer.setOnClickListener {
            uiState.onItemTapped.invoke()
        }
    }

    /**
     * Return true if this [Context] is available.
     * Availability is defined as the following:
     * + [Context] is not null
     * + [Context] is not destroyed (tested with [FragmentActivity.isDestroyed] or [Activity.isDestroyed])
     */
    private fun Context?.isAvailable(): Boolean {
        if (this == null) {
            return false
        } else if (this !is Application) {
            if (this is FragmentActivity) {
                return !this.isDestroyed
            } else if (this is Activity) {
                return !this.isDestroyed
            }
        }
        return true
    }


    companion object {
        fun from(parent: ViewGroup): LayoutViewHolder {
            val binding = ModalLayoutPickerLayoutsCardBinding.inflate(
                    LayoutInflater.from(parent.context),
                    parent,
                    false
            )
            return LayoutViewHolder(parent, binding)
        }
    }
}
