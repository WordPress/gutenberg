package com.gutenberg

import android.os.Bundle
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.RecyclerView.Adapter

/**
 * Renders the layout categories
 */
class LayoutCategoryAdapter(private var nestedScrollStates: Bundle) : Adapter<LayoutsItemViewHolder>() {
    private var items: List<LayoutCategoryUiState> = listOf()

    fun update(newItems: List<LayoutCategoryUiState>) {
        val diffResult = DiffUtil.calculateDiff(
                LayoutCategoryDiffCallback(
                        items,
                        newItems
                )
        )
        items = newItems
        diffResult.dispatchUpdatesTo(this)
    }

    override fun getItemCount(): Int = items.size

    override fun onBindViewHolder(holder: LayoutsItemViewHolder, position: Int) {
        holder.bind(items[position])
    }

    override fun onViewRecycled(holder: LayoutsItemViewHolder) {
        super.onViewRecycled(holder)
        holder.onRecycled()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) =
            LayoutsItemViewHolder(parent = parent, nestedScrollStates = nestedScrollStates)

    fun onRestoreInstanceState(savedInstanceState: Bundle) {
        nestedScrollStates = savedInstanceState
    }

    fun onSaveInstanceState(): Bundle {
        return nestedScrollStates
    }
}
