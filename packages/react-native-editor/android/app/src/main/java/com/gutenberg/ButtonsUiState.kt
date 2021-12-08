package com.gutenberg

/**
 * The buttons visibility state
 */
data class ButtonsUiState(
    val createBlankPageVisible: Boolean = true,
    val createPageVisible: Boolean = false,
    val previewVisible: Boolean = false,
    val retryVisible: Boolean = false
)
