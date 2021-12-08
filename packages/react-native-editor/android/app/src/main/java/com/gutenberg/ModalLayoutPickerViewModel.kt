package com.gutenberg

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import com.gutenberg.LayoutPickerUiState.Content
import kotlinx.coroutines.Dispatchers

/**
 * Implements the Modal Layout Picker view model
 */
class ModalLayoutPickerViewModel: LayoutPickerViewModel() {
    /**
     * Tracks the Modal Layout Picker visibility state
     */
    private val _isModalLayoutPickerShowing = MutableLiveData<Event<Boolean>>()
    val isModalLayoutPickerShowing: LiveData<Event<Boolean>> = _isModalLayoutPickerShowing

    override val useCachedData: Boolean = true

    /**
     * Triggers the create page flow and shows the MLP
     */
    fun createPageFlowTriggered() {
        _isModalLayoutPickerShowing.value = Event(true)
        initializePreviewMode(false)
        fetchLayouts()
    }

    override fun fetchLayouts() {
        val aboutCategory = GutenbergLayoutCategory(
            slug = "about",
            title = "About",
            description = "About pages",
            emoji = "👋"
        )

        val aboutLayout = GutenbergLayout(
            slug = "about",
            title = "About",
            previewTablet = "https://headstartdata.files.wordpress.com/2020/01/about-2.png",
            previewMobile = "https://headstartdata.files.wordpress.com/2020/01/about-2.png",
            preview = "https://headstartdata.files.wordpress.com/2020/01/about-2.png",
            content = "",
            demoUrl = "",
            categories = listOf(aboutCategory)
        )

        val layouts: List<LayoutModel> = listOf(LayoutModel(aboutLayout))
        val categories: List<LayoutCategoryModel> = listOf(LayoutCategoryModel(aboutCategory))
        handleResponse(layouts, categories)
    }

    /**
     * Dismisses the MLP
     */
    fun dismiss() {
        _isModalLayoutPickerShowing.postValue(Event(false))
        updateUiState(Content())
    }

    /**
     * Create page tapped
     */
    fun onCreatePageClicked() {
        createPage()
        dismiss()
    }

    override fun onPreviewChooseTapped() {
        super.onPreviewChooseTapped()
        onCreatePageClicked()
    }

    /**
     * Triggers the creation of a new page
     */
    private fun createPage() {
//        selectedLayout?.let { layout ->
//            _onCreateNewPageRequested.value = PageRequest.Create(layout.slug, layout.title)
//            return
//        }
//        _onCreateNewPageRequested.value = PageRequest.Blank
    }
}
