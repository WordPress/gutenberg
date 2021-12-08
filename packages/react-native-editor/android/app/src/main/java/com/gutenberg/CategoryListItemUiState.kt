package com.gutenberg

import com.gutenberg.R.attr

/**
 * The category list item
 */
data class CategoryListItemUiState(
    val slug: String,
    val title: String,
    val emoji: String,
    val selected: Boolean,
    val onItemTapped: (() -> Unit)
) {
    val background: Int
        get() = if (selected) attr.categoriesButtonBackgroundSelected else attr.categoriesButtonBackground

    val textColor: Int
        get() = if (selected) attr.colorOnPrimary else attr.colorOnSurface

    val checkIconVisible: Boolean
        get() = selected

    val emojiIconVisible: Boolean
        get() = !selected

    val contentDescriptionResId: Int
        get() = if (selected) R.string.mlp_selected_description else R.string.mlp_notselected_description
}
