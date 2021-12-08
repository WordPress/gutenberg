package com.gutenberg

import android.content.Context
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.RecyclerView
//import org.wordpress.android.WordPress

/**
 * Renders the Layout cards
 */
class LayoutsAdapter(context: Context) : RecyclerView.Adapter<LayoutViewHolder>() {

    private var layouts: List<LayoutListItemUiState> = listOf()

//    init {
//        (context.applicationContext as WordPress).component().inject(this)
//    }

    fun setData(data: List<LayoutListItemUiState>) {
        val diffResult = DiffUtil.calculateDiff(LayoutsDiffCallback(layouts, data))
        layouts = data
        diffResult.dispatchUpdatesTo(this)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) =
        LayoutViewHolder.from(parent)

    override fun getItemCount(): Int = layouts.size

    override fun onBindViewHolder(holder: LayoutViewHolder, position: Int) {
        holder.onBind(layouts[position])
    }
}
