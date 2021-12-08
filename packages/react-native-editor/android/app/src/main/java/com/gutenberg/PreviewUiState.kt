package com.gutenberg

import androidx.annotation.StringRes

sealed class PreviewUiState {
    class Loading(val url: String) : PreviewUiState()
    object Loaded : PreviewUiState()
    class Error(@StringRes val toast: Int? = null) : PreviewUiState()
}
