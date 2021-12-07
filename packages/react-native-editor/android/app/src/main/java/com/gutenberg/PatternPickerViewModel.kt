package com.gutenberg

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import kotlinx.coroutines.CoroutineDispatcher
import org.greenrobot.eventbus.Subscribe
import org.greenrobot.eventbus.ThreadMode
import org.wordpress.android.BuildConfig
import org.wordpress.android.R.string
import org.wordpress.android.fluxc.Dispatcher
import org.wordpress.android.fluxc.generated.SiteActionBuilder
import org.wordpress.android.fluxc.model.SiteModel
import org.wordpress.android.fluxc.store.SiteStore
import org.wordpress.android.fluxc.store.SiteStore.FetchBlockLayoutsPayload
import org.wordpress.android.fluxc.store.SiteStore.OnBlockLayoutsFetched
import org.wordpress.android.modules.BG_THREAD
import org.wordpress.android.modules.UI_THREAD
import org.wordpress.android.ui.layoutpicker.LayoutModel
import org.wordpress.android.ui.layoutpicker.LayoutPickerUiState.Content
import org.wordpress.android.ui.layoutpicker.LayoutPickerUiState.Error
import org.wordpress.android.ui.layoutpicker.LayoutPickerUiState.Loading
import org.wordpress.android.ui.layoutpicker.LayoutPickerViewModel
import org.wordpress.android.ui.layoutpicker.ThumbDimensionProvider
import org.wordpress.android.ui.layoutpicker.toLayoutCategories
import org.wordpress.android.ui.layoutpicker.toLayoutModels
import org.wordpress.android.ui.mlp.ModalLayoutPickerTracker
import org.wordpress.android.ui.mlp.SupportedBlocksProvider
import org.wordpress.android.ui.mysite.SelectedSiteRepository
import org.wordpress.android.util.DisplayUtilsWrapper
import org.wordpress.android.util.NetworkUtilsWrapper
import org.wordpress.android.util.SiteUtils
import org.wordpress.android.viewmodel.Event
import org.wordpress.android.viewmodel.SingleLiveEvent
import javax.inject.Inject
import javax.inject.Named

/**
 * Implements the Modal Layout Picker view model
 */
class PatternPickerViewModel @Inject constructor(
    private val dispatcher: Dispatcher,
    private val siteStore: SiteStore,
    private val selectedSiteRepository: SelectedSiteRepository,
    private val supportedBlocksProvider: SupportedBlocksProvider,
    private val thumbDimensionProvider: ThumbDimensionProvider,
    private val displayUtilsWrapper: DisplayUtilsWrapper,
    override val networkUtils: NetworkUtilsWrapper,
    private val analyticsTracker: ModalLayoutPickerTracker,
    @Named(BG_THREAD) override val bgDispatcher: CoroutineDispatcher,
    @Named(UI_THREAD) override val mainDispatcher: CoroutineDispatcher
) : PickerViewModel(mainDispatcher, bgDispatcher, networkUtils, analyticsTracker) {
    /**
     * Tracks the Modal Layout Picker visibility state
     */
    private val _isModalLayoutPickerShowing = MutableLiveData<Event<Boolean>>()
    val isModalLayoutPickerShowing: LiveData<Event<Boolean>> = _isModalLayoutPickerShowing

    /**
     * Create new page event
     */
    private val _onCreateNewPageRequested = SingleLiveEvent<PageRequest.Create>()
    val onCreateNewPageRequested: LiveData<PageRequest.Create> = _onCreateNewPageRequested

    private val site: SiteModel? by lazy {
        siteStore.getSiteByLocalId(selectedSiteRepository.getSelectedSiteLocalId(true))
    }

    override val useCachedData: Boolean = true

    override val selectedLayout: LayoutModel?
        get() = (uiState.value as? Content)?.let { state ->
            state.selectedLayoutSlug?.let { slug ->
                site?.let { site ->
                    siteStore.getBlockLayout(site, slug)
                }
            }?.let { LayoutModel(it) }
        }

    sealed class PageRequest(val template: String?) {
        open class Create(template: String?, val title: String) : PageRequest(template)
        object Blank : Create(null, "")
        class Preview(template: String?, val content: String, val site: SiteModel, val demoUrl: String?) : PageRequest(
                template
        )
    }

    init {
        dispatcher.register(this)
    }

    override fun onCleared() {
        dispatcher.unregister(this)
        super.onCleared()
    }

    override fun fetchLayouts(preferCache: Boolean) {
        val selectedSite = site
        if (!networkUtils.isNetworkAvailable() || selectedSite == null) {
            setErrorState()
            return
        }
        if (!preferCache) {
            updateUiState(Loading)
        }
        launch {
            val payload = FetchBlockLayoutsPayload(
                    selectedSite,
                    supportedBlocksProvider.fromAssets().supported,
                    thumbDimensionProvider.previewWidth.toFloat(),
                    thumbDimensionProvider.previewHeight.toFloat(),
                    thumbDimensionProvider.scale.toFloat(),
                    BuildConfig.DEBUG,
                    preferCache
            )
            dispatcher.dispatch(SiteActionBuilder.newFetchBlockLayoutsAction(payload))
        }
    }

    @Subscribe(threadMode = ThreadMode.MAIN)
    fun onBlockLayoutsFetched(event: OnBlockLayoutsFetched) {
        if (event.isError) {
            setErrorState()
        } else {
            handleResponse(
                    (event.layouts ?: listOf()).toLayoutModels(),
                    (event.categories ?: listOf()).toLayoutCategories()
            )
        }
    }

    private fun setErrorState() {
        if (networkUtils.isNetworkAvailable()) {
            updateUiState(Error(string.mlp_error_title, string.mlp_error_subtitle))
        } else {
            updateUiState(Error(string.mlp_network_error_title, string.mlp_network_error_subtitle))
        }
    }

    /**
     * Checks if the Modal Layout Picker can be shown
     * at this point the only requirement is to have the block editor enabled
     * @return true if the Modal Layout Picker can be shown
     */
    fun canShowModalLayoutPicker() = SiteUtils.isBlockEditorDefaultForNewPost(site)

    /**
     * Triggers the create page flow and shows the MLP
     */
    fun createPageFlowTriggered() {
        _isModalLayoutPickerShowing.value = Event(true)
        initializePreviewMode(displayUtilsWrapper.isTablet())
        fetchLayouts()
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
        selectedLayout?.let { layout ->
            _onCreateNewPageRequested.value = PageRequest.Create(layout.slug, layout.title)
            return
        }
        _onCreateNewPageRequested.value = PageRequest.Blank
    }
}
