package com.gutenberg

import android.os.Bundle
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import com.gutenberg.PreviewMode.MOBILE
import com.gutenberg.PreviewMode.TABLET
import com.gutenberg.PreviewMode.valueOf
import com.gutenberg.LayoutPickerUiState.Content
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

private const val FETCHED_LAYOUTS = "FETCHED_LAYOUTS"
private const val FETCHED_CATEGORIES = "FETCHED_CATEGORIES"
private const val SELECTED_LAYOUT = "SELECTED_LAYOUT"
private const val SELECTED_CATEGORIES = "SELECTED_CATEGORIES"
private const val PREVIEW_MODE = "PREVIEW_MODE"

abstract class LayoutPickerViewModel: ScopedViewModel(Dispatchers.Default), PreviewModeHandler {
    lateinit var layouts: List<LayoutModel>
    lateinit var categories: List<LayoutCategoryModel>

    private val _uiState: MutableLiveData<LayoutPickerUiState> = MutableLiveData()
    val uiState: LiveData<LayoutPickerUiState> = _uiState

    private val _previewMode = SingleLiveEvent<PreviewMode>()
    val previewMode: LiveData<PreviewMode> = _previewMode

    private val _previewState: MutableLiveData<PreviewUiState> = MutableLiveData()
    val previewState: LiveData<PreviewUiState> = _previewState

    private val _onPreviewModeButtonPressed = SingleLiveEvent<Unit>()
    val onPreviewModeButtonPressed: LiveData<Unit> = _onPreviewModeButtonPressed

    private val _onPreviewActionPressed = SingleLiveEvent<DesignPreviewAction>()
    val onPreviewActionPressed: LiveData<DesignPreviewAction> = _onPreviewActionPressed

    private val _onCategorySelectionChanged = MutableLiveData<Event<Unit>>()
    val onCategorySelectionChanged: LiveData<Event<Unit>> = _onCategorySelectionChanged

    private val _onThumbnailModeButtonPressed = SingleLiveEvent<Unit>()
    val onThumbnailModeButtonPressed: LiveData<Unit> = _onThumbnailModeButtonPressed

    val isLoading: Boolean
        get() = _uiState.value === LayoutPickerUiState.Loading

    open val selectedLayout: LayoutModel?
        get() = (uiState.value as? Content)?.let { state ->
            layouts.firstOrNull { it.slug == state.selectedLayoutSlug }
        }

    abstract val useCachedData: Boolean

    var nestedScrollStates: Bundle = Bundle()

    abstract fun fetchLayouts()

    open fun onPreviewChooseTapped() = onDismissPreview()

    fun handleResponse(layouts: List<LayoutModel>, categories: List<LayoutCategoryModel>) {
        this.layouts = layouts
        this.categories = categories
        loadCategories()
    }

    fun initializePreviewMode(isTablet: Boolean) {
        if (_previewMode.value == null) {
            _previewMode.value = if (isTablet) TABLET else MOBILE
        }
    }

    override fun selectedPreviewMode() = previewMode.value ?: MOBILE

    override fun onPreviewModeChanged(mode: PreviewMode) {
        if (_previewMode.value !== mode) {
            _previewMode.value = mode
            if (uiState.value is Content) {
                loadLayouts()
            }
        }
    }

    fun updateUiState(uiState: LayoutPickerUiState) {
        _uiState.value = uiState
    }

    /**
     * Category tapped
     * @param categorySlug the slug of the tapped category
     */
    fun onCategoryTapped(categorySlug: String) {
        (uiState.value as? Content)?.let { state ->
            if (state.selectedCategoriesSlugs.contains(categorySlug)) { // deselect
                updateUiState(
                        state.copy(selectedCategoriesSlugs = state.selectedCategoriesSlugs.apply {
                            remove(categorySlug)
                        })
                )
            } else {
                updateUiState(
                        state.copy(selectedCategoriesSlugs = state.selectedCategoriesSlugs.apply { add(categorySlug) })
                )
            }
            loadCategories()
            _onCategorySelectionChanged.postValue(Event(Unit))
        }
    }

    private fun loadCategories() {
        val state = uiState.value as? Content ?: Content()
        launch(Dispatchers.Default) {
            val listItems: List<CategoryListItemUiState> = categories.map {
                CategoryListItemUiState(
                        it.slug,
                        it.title,
                        it.emoji,
                        state.selectedCategoriesSlugs.contains(it.slug)
                ) { onCategoryTapped(it.slug) }
            }
            withContext(Dispatchers.Main) {
                updateUiState(state.copy(categories = listItems))
            }
            loadLayouts()
        }
    }

    private fun loadLayouts() {
        val state = uiState.value as? Content ?: Content()
        launch(Dispatchers.Default) {
            val listItems = ArrayList<LayoutCategoryUiState>()

            val selectedCategories = if (state.selectedCategoriesSlugs.isNotEmpty()) {
                categories.filter { state.selectedCategoriesSlugs.contains(it.slug) }
            } else {
                categories
            }

            selectedCategories.forEach { category ->

                val layouts = layouts.getFilteredLayouts(category.slug).map { layout ->
                    LayoutListItemUiState(
                            slug = layout.slug,
                            title = layout.title,
                            preview = when (_previewMode.value) {
                                MOBILE -> layout.previewMobile
                                TABLET -> layout.previewTablet
                                else -> layout.preview
                            },
                            selected = layout.slug == state.selectedLayoutSlug,
                            onItemTapped = { onLayoutTapped(layoutSlug = layout.slug) },
                            onThumbnailReady = { onThumbnailReady(layoutSlug = layout.slug) }
                    )
                }
                listItems.add(
                        LayoutCategoryUiState(
                                category.slug,
                                category.title,
                                category.description,
                                layouts
                        )
                )
            }
            withContext(Dispatchers.Main) {
                updateUiState(state.copy(layoutCategories = listItems))
            }
        }
    }

    /**
     * Layout tapped
     * @param layoutSlug the slug of the tapped layout
     */
    fun onLayoutTapped(layoutSlug: String) {
        (uiState.value as? Content)?.let { state ->
            if (!state.loadedThumbnailSlugs.contains(layoutSlug)) return // No action
            if (layoutSlug == state.selectedLayoutSlug) { // deselect
                updateUiState(state.copy(selectedLayoutSlug = null, isToolbarVisible = false))
            } else {
                updateUiState(state.copy(selectedLayoutSlug = layoutSlug, isToolbarVisible = true))
            }
            updateButtonsUiState()
            loadLayouts()
        }
    }

    /**
     * Layout thumbnail is ready
     * @param layoutSlug the slug of the tapped layout
     */
    fun onThumbnailReady(layoutSlug: String) {
        (uiState.value as? Content)?.let { state ->
            updateUiState(state.copy(loadedThumbnailSlugs = state.loadedThumbnailSlugs.apply { add(layoutSlug) }))
        }
    }

    /**
     * Updates the buttons UiState
     */
    private fun updateButtonsUiState() {
        (uiState.value as? Content)?.let { state ->
            val selection = state.selectedLayoutSlug != null
            updateUiState(state.copy(buttonsUiState = ButtonsUiState(!selection, selection, selection)))
        }
    }

    fun onThumbnailModePressed() {
        _onThumbnailModeButtonPressed.call()
    }

    /**
     * Retries data fetching
     */
    fun onRetryClicked() = fetchLayouts()

    fun onPreviewModePressed() {
        _onPreviewModeButtonPressed.call()
    }

    fun onDismissPreview() {
        _onPreviewActionPressed.value = DesignPreviewAction.Dismiss
    }

    /**
     * Appbar scrolled event used to set the header and title visibility
     * @param verticalOffset the scroll state vertical offset
     * @param scrollThreshold the scroll threshold
     */
    fun onAppBarOffsetChanged(verticalOffset: Int, scrollThreshold: Int) {
        val headerShouldBeVisible = verticalOffset < scrollThreshold
        (uiState.value as? Content)?.let { state ->
            if (state.isHeaderVisible == headerShouldBeVisible) return // No change
            updateUiState(state.copy(isHeaderVisible = headerShouldBeVisible))
        }
    }

    fun loadSavedState(savedInstanceState: Bundle?) {
        if (savedInstanceState == null) return
        val layouts = savedInstanceState.getParcelableArrayList<LayoutModel>(FETCHED_LAYOUTS)
        val categories = savedInstanceState.getParcelableArrayList<LayoutCategoryModel>(
            FETCHED_CATEGORIES
        )
        val selected = savedInstanceState.getString(SELECTED_LAYOUT)
        val selectedCategories = (savedInstanceState.getSerializable(SELECTED_CATEGORIES) as? List<*>)
                ?.filterIsInstance<String>() ?: listOf()
        val previewMode = savedInstanceState.getString(PREVIEW_MODE, MOBILE.name)
        resetState(selected, ArrayList(selectedCategories.toMutableList()), previewMode)
        if (layouts == null || categories == null || layouts.isEmpty()) {
            fetchLayouts()
            return
        }
        handleResponse(layouts, categories)
    }

    private fun resetState(selected: String?, selectedCategories: ArrayList<String>, previewMode: String) {
        val state = uiState.value as? Content ?: Content()
        updateUiState(
                state.copy(
                        selectedLayoutSlug = selected,
                        selectedCategoriesSlugs = selectedCategories
                )
        )
        _previewMode.value = valueOf(previewMode)
        updateButtonsUiState()
    }

    fun writeToBundle(outState: Bundle) {
        (uiState.value as? Content)?.let {
            if (!useCachedData) {
                outState.putParcelableArrayList(FETCHED_LAYOUTS, ArrayList(layouts))
                outState.putParcelableArrayList(FETCHED_CATEGORIES, ArrayList(categories))
            }
            outState.putString(SELECTED_LAYOUT, it.selectedLayoutSlug)
            outState.putSerializable(SELECTED_CATEGORIES, it.selectedCategoriesSlugs)
            outState.putString(PREVIEW_MODE, selectedPreviewMode().name)
        }
    }

    sealed class DesignPreviewAction {
        object Dismiss : DesignPreviewAction()
        class Show(val template: String, val demoUrl: String) : DesignPreviewAction()
    }
}
