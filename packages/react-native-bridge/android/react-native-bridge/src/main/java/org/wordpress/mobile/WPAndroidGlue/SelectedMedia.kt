package org.wordpress.mobile.WPAndroidGlue

import android.os.Parcelable
import kotlinx.parcelize.Parcelize

@Parcelize
data class SelectedMedia(
        private val mediaList: MutableList<Media> = mutableListOf(),
        private var blockIndex: Int? = null,
        private var isMediaBeingPickedByUser: Boolean = false
): Parcelable {
    fun setBlockIndex(n: Int) {
        blockIndex = n
        isMediaBeingPickedByUser = true
    }

    fun add(media: Media) {
        mediaList.add(media)
    }

    fun add(media: List<Media>) {
        mediaList.addAll(media)
    }

    fun remove(media: Media) {
        mediaList.remove(media)
    }

    fun getList() = mediaList

    fun clear() {
        mediaList.clear()
    }

    fun getBlockIndex() = blockIndex

    fun resetBlockIndex() {
        blockIndex = null
    }

    fun isMediaBeingPickedByUser() = isMediaBeingPickedByUser

    fun userFinishedPickingMedia() {
        isMediaBeingPickedByUser = false
    }
}
