package com.gutenberg

import android.annotation.SuppressLint
import android.os.Parcelable
import kotlinx.parcelize.Parcelize

@Parcelize
@SuppressLint("ParcelCreator")
class LayoutCategoryModel(
    private val blockLayoutCategory: GutenbergLayoutCategory? = null
) : Parcelable {
    val slug: String
        get() = blockLayoutCategory?.slug ?: ""
    val title: String
        get() = blockLayoutCategory?.title ?: ""
    val description: String
        get() = blockLayoutCategory?.description ?: ""
    val emoji: String
        get() = blockLayoutCategory?.emoji ?: ""
}

@JvmName("gutenbergLayoutToLayoutCategories")
fun List<GutenbergLayoutCategory>.toLayoutCategories() = map { LayoutCategoryModel(blockLayoutCategory = it) }
