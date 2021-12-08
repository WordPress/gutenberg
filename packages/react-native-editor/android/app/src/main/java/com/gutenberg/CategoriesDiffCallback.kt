package com.gutenberg

import androidx.recyclerview.widget.DiffUtil.Callback

/**
 * Implements the Recyclerview list items diff to avoid unneeded UI refresh
 */
class CategoriesDiffCallback(
    private val oldList: List<CategoryListItemUiState>,
    private val newList: List<CategoryListItemUiState>
) : Callback() {
    override fun areItemsTheSame(oldItemPosition: Int, newItemPosition: Int) =
            newList[newItemPosition].slug == oldList[oldItemPosition].slug

    override fun getOldListSize(): Int = oldList.size

    override fun getNewListSize(): Int = newList.size

    override fun areContentsTheSame(oldItemPosition: Int, newItemPosition: Int): Boolean {
        val new = newList[newItemPosition]
        val old = oldList[oldItemPosition]
        return new.selected == old.selected && new.slug == old.slug
    }
}
