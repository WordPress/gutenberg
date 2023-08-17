package org.wordpress.mobile.WPAndroidGlue

import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeMap
import org.wordpress.mobile.ReactNativeGutenbergBridge.GutenbergBridgeJS2Parent.MediaType
import org.wordpress.mobile.ReactNativeGutenbergBridge.GutenbergBridgeJS2Parent.MediaType.IMAGE
import org.wordpress.mobile.ReactNativeGutenbergBridge.GutenbergBridgeJS2Parent.MediaType.OTHER
import org.wordpress.mobile.ReactNativeGutenbergBridge.GutenbergBridgeJS2Parent.MediaType.VIDEO
import org.wordpress.mobile.ReactNativeGutenbergBridge.RNMedia
import java.util.Locale

data class Media(
    override val id: Int,
    override val url: String,
    override val type: String,
    override val caption: String = "",
    override val title: String = "",
    override val alt: String = "",
    override val metadata: WritableMap = WritableNativeMap()
) : RNMedia {
    override fun toMap(): WritableMap = WritableNativeMap().apply {
        putInt("id", id)
        putString("url", url)
        putString("type", type)
        putString("caption", caption)
        putString("title", title)
        putString("alt", alt)
        putMap("metadata", metadata)
    }

    companion object {
        private fun convertToType(mimeType: String?): String {
            val isMediaType = { mediaType: MediaType ->
                mimeType?.startsWith(mediaType.name.toLowerCase(Locale.ROOT)) == true
            }
            val type = when {
                isMediaType(IMAGE) -> IMAGE
                isMediaType(VIDEO) -> VIDEO
                else -> OTHER
            }.name.toLowerCase(Locale.ROOT)
            return type;
        }

        @JvmStatic
        fun createRNMediaUsingMimeType(
            id: Int,
            url: String,
            mimeType: String?,
            caption: String?,
            title: String?,
            alt: String?,
        ): Media {
            val type = convertToType(mimeType)
            return Media(id, url, type, caption ?: "", title ?: "", alt ?: "")
        }
        @JvmStatic
        fun createRNMediaUsingMimeType(
            id: Int,
            url: String,
            mimeType: String?,
            caption: String?,
            title: String?,
            alt: String?,
            metadata: WritableNativeMap = WritableNativeMap()
        ): Media {
            val type = convertToType(mimeType)
            return Media(id, url, type, caption ?: "", title ?: "", alt ?: "", metadata)
        }
    }
}
