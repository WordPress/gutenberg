package com.gutenberg

import androidx.recyclerview.widget.DiffUtil.Callback

/**
 * Implements the Recyclerview list items diff to avoid unneeded UI refresh
 */
class LayoutCategoryDiffCallback(
    private val oldList: List<LayoutCategoryUiState>,
    private val newList: List<LayoutCategoryUiState>
) : Callback() {
    object Payload
    override fun areItemsTheSame(oldItemPosition: Int, newItemPosition: Int): Boolean {
        return newList[newItemPosition].slug == oldList[oldItemPosition].slug
    }

    override fun getOldListSize(): Int = oldList.size

    override fun getNewListSize(): Int = newList.size

    override fun areContentsTheSame(oldItemPosition: Int, newItemPosition: Int): Boolean {
        return newList[newItemPosition].layouts == oldList[oldItemPosition].layouts
    }

    override fun getChangePayload(oldItemPosition: Int, newItemPosition: Int): Any? {
        return Payload
    }
}
