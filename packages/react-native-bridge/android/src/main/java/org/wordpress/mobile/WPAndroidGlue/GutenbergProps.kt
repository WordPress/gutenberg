package org.wordpress.mobile.WPAndroidGlue

import android.os.Bundle
import android.os.Parcelable
import kotlinx.android.parcel.Parcelize

@Parcelize
data class GutenbergProps(
    val enableMentions: Boolean,
    val enableUnsupportedBlockEditor: Boolean,
    val localeSlug: String,
    val postType: String,
    val editorTheme: Bundle?,
    var translations: Bundle? = null,
    var isDarkMode: Boolean? = null,
    var htmlModeEnabled: Boolean? = null
) : Parcelable {

    constructor(
        enableMentions: Boolean,
        enableUnsupportedBlockEditor: Boolean,
        localeSlug: String,
        postType: String,
        editorTheme: Bundle?
    ) : this(
            enableMentions = enableMentions,
            enableUnsupportedBlockEditor = enableUnsupportedBlockEditor,
            localeSlug = localeSlug,
            postType = postType,
            editorTheme = editorTheme,
            translations = null,
            isDarkMode = null,
            htmlModeEnabled = null
    )

    private fun getCapabilities() = Bundle().apply {
        putBoolean(PROP_CAPABILITIES_MENTIONS, enableMentions)
        putBoolean( PROP_CAPABILITIES_UNSUPPORTED_BLOCK_EDITOR, enableUnsupportedBlockEditor)
    }

    fun getInitialProps(bundle: Bundle?) = (bundle ?: Bundle()).apply {
        putString(PROP_INITIAL_DATA, "")
        putString(PROP_INITIAL_TITLE, "")
        putString(PROP_LOCALE, localeSlug)
        putString(PROP_POST_TYPE, postType)
        putBundle(PROP_TRANSLATIONS, requireNotNull(translations))
        putBoolean(PROP_INITIAL_HTML_MODE_ENABLED, requireNotNull(htmlModeEnabled))
        putBundle(PROP_CAPABILITIES, getCapabilities())

        editorTheme?.getSerializable(PROP_COLORS)?.let { colors ->
            putSerializable(PROP_COLORS, colors)
        }

        editorTheme?.getSerializable(PROP_GRADIENTS)?.let { gradients ->
            putSerializable(PROP_GRADIENTS, gradients)
        }
    }

    companion object {

        fun initContent(bundle: Bundle?, title: String?, content: String?) =
                (bundle ?: Bundle()).apply {
                    title?.let { putString(PROP_INITIAL_TITLE, it) }
                    content?.let { putString(PROP_INITIAL_DATA, it) }
                }

        private const val PROP_INITIAL_DATA = "initialData"
        private const val PROP_INITIAL_TITLE = "initialTitle"
        private const val PROP_INITIAL_HTML_MODE_ENABLED = "initialHtmlModeEnabled"
        private const val PROP_POST_TYPE = "postType"
        private const val PROP_LOCALE = "locale"
        private const val PROP_TRANSLATIONS = "translations"
        private const val PROP_CAPABILITIES = "capabilities"
        private const val PROP_CAPABILITIES_MENTIONS = "mentions"
        private const val PROP_CAPABILITIES_UNSUPPORTED_BLOCK_EDITOR = "unsupportedBlockEditor"
        private const val PROP_COLORS = "colors"
        private const val PROP_GRADIENTS = "gradients"
    }
}
