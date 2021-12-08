package com.gutenberg

import android.annotation.SuppressLint
import android.os.Parcelable
import kotlinx.parcelize.Parcelize

@Parcelize
@SuppressLint("ParcelCreator")
data class LayoutModel(
    val slug: String,
    val title: String,
    val preview: String,
    val previewTablet: String,
    val previewMobile: String,
    val demoUrl: String,
    val categories: List<LayoutCategoryModel>
) : Parcelable {
    constructor(blockLayout: GutenbergLayout) : this(
            blockLayout.slug,
            blockLayout.title,
            blockLayout.preview,
            blockLayout.previewTablet,
            blockLayout.previewMobile,
            blockLayout.demoUrl,
            blockLayout.categories.toLayoutCategories()
    )
}

@JvmName("blockLayoutToLayoutModel") fun List<GutenbergLayout>.toLayoutModels() = map { LayoutModel(blockLayout = it) }

fun List<LayoutModel>.getFilteredLayouts(categorySlug: String) =
        filter { l -> l.categories.any { c -> c.slug == categorySlug } }

@Parcelize
data class GutenbergLayout(
    val slug: String,
    val title: String,
    val preview: String,
    val previewTablet: String,
    val previewMobile: String,
    val content: String,
    val demoUrl: String,
    val categories: List<GutenbergLayoutCategory>
) : Parcelable

@Parcelize
data class GutenbergLayoutCategory(
    val slug: String,
    val title: String,
    val description: String,
    val emoji: String?
) : Parcelable
