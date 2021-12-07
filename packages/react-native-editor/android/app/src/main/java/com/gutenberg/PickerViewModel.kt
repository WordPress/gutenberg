package com.gutenberg

import android.os.Bundle
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.withContext
import org.wordpress.android.R
import org.wordpress.android.R.string
import org.wordpress.android.ui.PreviewMode
import org.wordpress.android.ui.PreviewMode.MOBILE
import org.wordpress.android.ui.PreviewMode.TABLET
import org.wordpress.android.ui.PreviewMode.valueOf
import org.wordpress.android.ui.PreviewModeHandler
import org.wordpress.android.ui.layoutpicker.LayoutPickerUiState.Content
import org.wordpress.android.ui.layoutpicker.LayoutPickerUiState.Error
import org.wordpress.android.util.NetworkUtilsWrapper
import org.wordpress.android.viewmodel.Event
import org.wordpress.android.viewmodel.ScopedViewModel
import org.wordpress.android.viewmodel.SingleLiveEvent

private const val FETCHED_LAYOUTS = "FETCHED_LAYOUTS"
private const val FETCHED_CATEGORIES = "FETCHED_CATEGORIES"
private const val SELECTED_LAYOUT = "SELECTED_LAYOUT"
private const val SELECTED_CATEGORIES = "SELECTED_CATEGORIES"
private const val PREVIEW_MODE = "PREVIEW_MODE"

abstract class PickerViewModel(
    open val mainDispatcher: CoroutineDispatcher,
    open val bgDispatcher: CoroutineDispatcher,
    open val networkUtils: NetworkUtilsWrapper,
    private val layoutPickerTracker: LayoutPickerTracker
) : ScopedViewModel(bgDispatcher), PreviewModeHandler {
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

    abstract fun fetchLayouts(preferCache: Boolean = false)

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
            layoutPickerTracker.trackPreviewModeChanged(mode.key)
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
                layoutPickerTracker.filterDeselected(categorySlug, state.selectedCategoriesSlugs)
            } else {
                updateUiState(
                        state.copy(selectedCategoriesSlugs = state.selectedCategoriesSlugs.apply { add(categorySlug) })
                )
                layoutPickerTracker.filterSelected(categorySlug, state.selectedCategoriesSlugs)
            }
            loadCategories()
            _onCategorySelectionChanged.postValue(Event(Unit))
        }
    }

    private fun loadCategories() {
        val state = uiState.value as? Content ?: Content()
        launch(bgDispatcher) {
            val listItems: List<CategoryListItemUiState> = categories.map {
                CategoryListItemUiState(
                        it.slug,
                        it.title,
                        it.emoji,
                        state.selectedCategoriesSlugs.contains(it.slug)
                ) { onCategoryTapped(it.slug) }
            }
            withContext(mainDispatcher) {
                updateUiState(state.copy(categories = listItems))
            }
            loadLayouts()
        }
    }

    private fun loadLayouts() {
        val state = uiState.value as? Content ?: Content()
        launch(bgDispatcher) {
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
            withContext(mainDispatcher) {
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
        layoutPickerTracker.trackThumbnailModeTapped(selectedPreviewMode().key)
        _onThumbnailModeButtonPressed.call()
    }

    /**
     * Retries data fetching
     */
    fun onRetryClicked() = fetchLayouts()

    fun onPreviewLoading() {
        if (networkUtils.isNetworkAvailable()) {
            selectedLayout?.let { layout ->
                _previewState.value = PreviewUiState.Loading(layout.demoUrl)
                layoutPickerTracker.trackPreviewLoading(layout.slug, selectedPreviewMode().key)
            }
        } else {
            _previewState.value = PreviewUiState.Error(toast = R.string.hpp_retry_error)
            layoutPickerTracker.trackNoNetworkErrorShown("Preview error")
        }
    }

    fun onPreviewLoaded() {
        selectedLayout?.let { layout ->
            _previewState.value = PreviewUiState.Loaded
            layoutPickerTracker.trackPreviewLoaded(layout.slug, selectedPreviewMode().key)
        }
    }

    fun onPreviewError() {
        _previewState.value = PreviewUiState.Error()
        layoutPickerTracker.trackErrorShown("Preview error")
    }

    fun onPreviewModePressed() {
        layoutPickerTracker.trackPreviewModeTapped(selectedPreviewMode().key)
        _onPreviewModeButtonPressed.call()
    }

    fun onPreviewTapped() {
        selectedLayout?.let { layout ->
            val template = layout.slug
            layoutPickerTracker.trackPreviewViewed(template, selectedPreviewMode().key)
            _onPreviewActionPressed.value = DesignPreviewAction.Show(template, layout.demoUrl)
            return
        }
        layoutPickerTracker.trackErrorShown("Error previewing design")
        updateUiState(Error(toast = string.hpp_choose_error))
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
        val categories = savedInstanceState.getParcelableArrayList<LayoutCategoryModel>(FETCHED_CATEGORIES)
        val selected = savedInstanceState.getString(SELECTED_LAYOUT)
        val selectedCategories = (savedInstanceState.getSerializable(SELECTED_CATEGORIES) as? List<*>)
                ?.filterIsInstance<String>() ?: listOf()
        val previewMode = savedInstanceState.getString(PREVIEW_MODE, MOBILE.name)
        resetState(selected, ArrayList(selectedCategories.toMutableList()), previewMode)
        if (layouts == null || categories == null || layouts.isEmpty()) {
            fetchLayouts(preferCache = useCachedData)
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
