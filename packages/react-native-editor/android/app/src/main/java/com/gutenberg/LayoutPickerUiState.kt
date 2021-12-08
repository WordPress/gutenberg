package com.gutenberg

import androidx.annotation.StringRes

sealed class LayoutPickerUiState(
    open val isHeaderVisible: Boolean = false,
    open val isToolbarVisible: Boolean = false,
    val isDescriptionVisible: Boolean = true,
    val loadingSkeletonVisible: Boolean = false,
    val errorViewVisible: Boolean = false,
    open val buttonsUiState: ButtonsUiState = ButtonsUiState()
) {
    object Loading : LayoutPickerUiState(loadingSkeletonVisible = true)

    data class Content(
        override val isHeaderVisible: Boolean = false,
        override val isToolbarVisible: Boolean = false,
        val selectedCategoriesSlugs: ArrayList<String> = arrayListOf(),
        val selectedLayoutSlug: String? = null,
        val loadedThumbnailSlugs: ArrayList<String> = arrayListOf(),
        val categories: List<CategoryListItemUiState> = listOf(),
        val layoutCategories: List<LayoutCategoryUiState> = listOf(),
        override val buttonsUiState: ButtonsUiState = ButtonsUiState()
    ) : LayoutPickerUiState()

    class Error(
        @StringRes val title: Int? = null,
        @StringRes val subtitle: Int? = null,
        @StringRes val toast: Int? = null
    ) : LayoutPickerUiState(
            errorViewVisible = true,
            isHeaderVisible = true,
            isDescriptionVisible = false,
            buttonsUiState = ButtonsUiState(retryVisible = true)
    )
}
