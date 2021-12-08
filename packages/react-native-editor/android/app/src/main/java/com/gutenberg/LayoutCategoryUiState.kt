package com.gutenberg

/**
 * The layout category row list item
 * @param slug the layout category slug
 * @param title the layout category title
 * @param description the layout category description
 * @param layouts the layouts list
 */
data class LayoutCategoryUiState(
    val slug: String,
    val title: String,
    val description: String,
    val layouts: List<LayoutListItemUiState>
)
