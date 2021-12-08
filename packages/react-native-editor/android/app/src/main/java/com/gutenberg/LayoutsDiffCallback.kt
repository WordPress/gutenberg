package com.gutenberg

import androidx.recyclerview.widget.DiffUtil.Callback
import com.gutenberg.LayoutListItemUiState

/**
 * Implements the Recyclerview list items diff to avoid unneeded UI refresh
 */
class LayoutsDiffCallback(
    private val oldList: List<LayoutListItemUiState>,
    private val newList: List<LayoutListItemUiState>
) : Callback() {
    override fun areItemsTheSame(oldItemPosition: Int, newItemPosition: Int) =
            newList[newItemPosition].slug == oldList[oldItemPosition].slug

    override fun getOldListSize(): Int = oldList.size

    override fun getNewListSize(): Int = newList.size

    override fun areContentsTheSame(oldItemPosition: Int, newItemPosition: Int): Boolean {
        val new = newList[newItemPosition]
        val old = oldList[oldItemPosition]
        return new.selected == old.selected && new.preview == old.preview && new.title == old.title
    }
}
