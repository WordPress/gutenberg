package com.gutenberg

/**
 * Holds the available preview/thumbnail modes
 *
 * @param key the preview mode key (used mainly for analytics)
 * @param previewWidth the rendering width of the preview
 */
enum class PreviewMode(val key: String, val previewWidth: Int) {
    MOBILE("mobile", 400),
    TABLET("tablet", 800),
    DESKTOP("desktop", 1200)
}

/**
 * Defines an interface for handling the [PreviewMode]
 */
interface PreviewModeHandler {
    fun selectedPreviewMode(): PreviewMode
    fun onPreviewModeChanged(mode: PreviewMode)
}
