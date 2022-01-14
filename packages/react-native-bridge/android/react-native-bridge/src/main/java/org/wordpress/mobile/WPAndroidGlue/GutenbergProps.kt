package org.wordpress.mobile.WPAndroidGlue

import android.os.Bundle
import androidx.annotation.VisibleForTesting
import java.util.Locale

data class GutenbergProps @JvmOverloads constructor(
    val enableContactInfoBlock: Boolean,
    val enableLayoutGridBlock: Boolean,
    val enableFacebookEmbed: Boolean,
    val enableInstagramEmbed: Boolean,
    val enableLoomEmbed: Boolean,
    val enableSmartframeEmbed: Boolean,
    val enableMediaFilesCollectionBlocks: Boolean,
    val enableMentions: Boolean,
    val enableXPosts: Boolean,
    val enableUnsupportedBlockEditor: Boolean,
    val canEnableUnsupportedBlockEditor: Boolean,
    val isAudioBlockMediaUploadEnabled: Boolean,
    val enableReusableBlock: Boolean,
    val localeSlug: String,
    val postType: String,
    val featuredImageId: Int,
    val editorTheme: Bundle?,
    val translations: Bundle,
    val isDarkMode: Boolean,
    val htmlModeEnabled: Boolean
) {

    fun getInitialProps(bundle: Bundle?) = (bundle ?: Bundle()).apply {
        putString(PROP_INITIAL_DATA, "")
        putString(PROP_INITIAL_TITLE, "")
        putString(PROP_LOCALE, revertDeprecatedLanguageCode(localeSlug))
        putString(PROP_POST_TYPE, postType)
        putInt(PROP_INITIAL_FEATURED_IMAGE_ID, featuredImageId)
        putBundle(PROP_TRANSLATIONS, translations)
        putBoolean(PROP_INITIAL_HTML_MODE_ENABLED, htmlModeEnabled)

        putBundle(PROP_CAPABILITIES, getUpdatedCapabilitiesProps())

        editorTheme?.also { theme ->
            theme.getSerializable(PROP_COLORS)?.let { putSerializable(PROP_COLORS, it) }
            theme.getSerializable(PROP_GRADIENTS)?.let { putSerializable(PROP_GRADIENTS, it) }
            theme.getSerializable(PROP_STYLES)
                    ?.let { putSerializable(PROP_STYLES, it) }
            theme.getSerializable(PROP_FEATURES)
                    ?.let { putSerializable(PROP_FEATURES, it) }
            theme.getSerializable(PROP_IS_FSE_THEME)
                    ?.let { putSerializable(PROP_IS_FSE_THEME, it) }
            theme.getSerializable(PROP_GALLERY_WITH_IMAGE_BLOCKS)
                    ?.let { putSerializable(PROP_GALLERY_WITH_IMAGE_BLOCKS, it) }
        }
    }

    fun getUpdatedCapabilitiesProps() = Bundle().apply {
        putBoolean(PROP_CAPABILITIES_MENTIONS, enableMentions)
        putBoolean(PROP_CAPABILITIES_XPOSTS, enableXPosts)
        putBoolean(PROP_CAPABILITIES_CONTACT_INFO_BLOCK, enableContactInfoBlock)
        putBoolean(PROP_CAPABILITIES_LAYOUT_GRID_BLOCK, enableLayoutGridBlock)
        putBoolean(PROP_CAPABILITIES_MEDIAFILES_COLLECTION_BLOCK, enableMediaFilesCollectionBlocks)
        putBoolean(PROP_CAPABILITIES_UNSUPPORTED_BLOCK_EDITOR, enableUnsupportedBlockEditor)
        putBoolean(PROP_CAPABILITIES_CAN_ENABLE_UNSUPPORTED_BLOCK_EDITOR, canEnableUnsupportedBlockEditor)
        putBoolean(PROP_CAPABILITIES_IS_AUDIO_BLOCK_MEDIA_UPLOAD_ENABLED, isAudioBlockMediaUploadEnabled)
        putBoolean(PROP_CAPABILITIES_REUSABLE_BLOCK, enableReusableBlock)
        putBoolean(PROP_CAPABILITIES_FACEBOOK_EMBED_BLOCK, enableFacebookEmbed)
        putBoolean(PROP_CAPABILITIES_INSTAGRAM_EMBED_BLOCK, enableInstagramEmbed)
        putBoolean(PROP_CAPABILITIES_LOOM_EMBED_BLOCK, enableLoomEmbed)
        putBoolean(PROP_CAPABILITIES_SMARTFRAME_EMBED_BLOCK, enableSmartframeEmbed)
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
        private const val PROP_INITIAL_FEATURED_IMAGE_ID = "featuredImageId"
        private const val PROP_TRANSLATIONS = "translations"
        private const val PROP_COLORS = "colors"
        private const val PROP_GRADIENTS = "gradients"
        private const val PROP_STYLES = "rawStyles"
        private const val PROP_FEATURES = "rawFeatures"
        private const val PROP_IS_FSE_THEME = "isFSETheme"
        private const val PROP_GALLERY_WITH_IMAGE_BLOCKS = "galleryWithImageBlocks"

        const val PROP_LOCALE = "locale"
        const val PROP_CAPABILITIES = "capabilities"
        const val PROP_CAPABILITIES_CONTACT_INFO_BLOCK = "contactInfoBlock"
        const val PROP_CAPABILITIES_LAYOUT_GRID_BLOCK = "layoutGridBlock"
        const val PROP_CAPABILITIES_FACEBOOK_EMBED_BLOCK = "facebookEmbed"
        const val PROP_CAPABILITIES_INSTAGRAM_EMBED_BLOCK = "instagramEmbed"
        const val PROP_CAPABILITIES_LOOM_EMBED_BLOCK = "loomEmbed"
        const val PROP_CAPABILITIES_SMARTFRAME_EMBED_BLOCK = "smartframeEmbed"
        const val PROP_CAPABILITIES_MEDIAFILES_COLLECTION_BLOCK = "mediaFilesCollectionBlock"
        const val PROP_CAPABILITIES_MENTIONS = "mentions"
        const val PROP_CAPABILITIES_XPOSTS = "xposts"
        const val PROP_CAPABILITIES_UNSUPPORTED_BLOCK_EDITOR = "unsupportedBlockEditor"
        const val PROP_CAPABILITIES_CAN_ENABLE_UNSUPPORTED_BLOCK_EDITOR = "canEnableUnsupportedBlockEditor"
        const val PROP_CAPABILITIES_IS_AUDIO_BLOCK_MEDIA_UPLOAD_ENABLED = "isAudioBlockMediaUploadEnabled"
        const val PROP_CAPABILITIES_REUSABLE_BLOCK = "reusableBlock"

        /**
         * Android converts some new language codes to older, deprecated ones, to preserve
         * backward compatibility. Gutenberg, however, uses the new language codes, so this
         * function uses Locale::toLanguageTag to convert back to the "new" codes that Gutenberg
         * requires.
         * See https://developer.android.com/reference/java/util/Locale#legacy-language-codes
         */
        @VisibleForTesting
        fun revertDeprecatedLanguageCode(localeSlug: String): String =
                Locale.forLanguageTag(localeSlug).toLanguageTag()
    }
}
