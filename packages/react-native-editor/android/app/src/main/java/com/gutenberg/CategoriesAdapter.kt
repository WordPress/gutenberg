package com.gutenberg

import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.RecyclerView

/**
 * Renders the Layout categories tab bar
 */
class CategoriesAdapter : RecyclerView.Adapter<CategoryViewHolder>() {
    private var categories: List<CategoryListItemUiState> = listOf()

    fun setData(data: List<CategoryListItemUiState>) {
        val diffResult = DiffUtil.calculateDiff(CategoriesDiffCallback(categories, data))
        categories = data
        diffResult.dispatchUpdatesTo(this)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) =
        CategoryViewHolder.from(parent)

    override fun getItemCount(): Int = categories.size

    override fun onBindViewHolder(holder: CategoryViewHolder, position: Int) {
        holder.onBind(categories[position])
    }
}
