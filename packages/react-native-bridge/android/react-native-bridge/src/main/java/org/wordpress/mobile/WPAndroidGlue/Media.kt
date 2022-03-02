package org.wordpress.mobile.WPAndroidGlue

import android.os.Parcelable
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeMap
import kotlinx.parcelize.Parcelize
import org.wordpress.mobile.ReactNativeGutenbergBridge.GutenbergBridgeJS2Parent.MediaType
import org.wordpress.mobile.ReactNativeGutenbergBridge.GutenbergBridgeJS2Parent.MediaType.IMAGE
import org.wordpress.mobile.ReactNativeGutenbergBridge.GutenbergBridgeJS2Parent.MediaType.OTHER
import org.wordpress.mobile.ReactNativeGutenbergBridge.GutenbergBridgeJS2Parent.MediaType.VIDEO
import org.wordpress.mobile.ReactNativeGutenbergBridge.RNMedia
import java.util.Locale

@Parcelize
data class Media(
    override val id: Int,
    override val url: String,
    override val type: String,
    override val caption: String = "",
    override val title: String = ""
) : RNMedia, Parcelable {
    override fun toMap(): WritableMap = WritableNativeMap().apply {
        putInt("id", id)
        putString("url", url)
        putString("type", type)
        putString("caption", caption)
        putString("title", title)
    }

    companion object {
        @JvmStatic
        fun createRNMediaUsingMimeType(
            id: Int,
            url: String,
            mimeType: String?,
            caption: String?,
            title: String?
        ): Media {
            val isMediaType = { mediaType: MediaType ->
                mimeType?.startsWith(mediaType.name.toLowerCase(Locale.ROOT)) == true
            }
            val type = when {
                isMediaType(IMAGE) -> IMAGE
                isMediaType(VIDEO) -> VIDEO
                else -> OTHER
            }.name.toLowerCase(Locale.ROOT)
            return Media(id, url, type, caption ?: "", title ?: "")
        }
    }
}
