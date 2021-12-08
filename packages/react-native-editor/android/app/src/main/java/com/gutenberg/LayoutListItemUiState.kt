package com.gutenberg


/**
 * The layout list item
 */
data class LayoutListItemUiState(
    val slug: String,
    val title: String,
    val preview: String,
    val selected: Boolean,
    val onItemTapped: (() -> Unit),
    val onThumbnailReady: (() -> Unit)
) {
    val contentDescriptionResId: Int
        get() = if (selected) R.string.mlp_selected_description else R.string.mlp_notselected_description

    val selectedOverlayVisible: Boolean
        get() = selected
}
