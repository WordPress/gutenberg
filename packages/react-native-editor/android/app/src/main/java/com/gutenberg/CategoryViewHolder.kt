package com.gutenberg

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.gutenberg.databinding.ModalLayoutPickerCategoryBinding

/**
 * Renders the Layout Category header buttons
 */
class CategoryViewHolder(
    private val parent: ViewGroup,
    private val binding: ModalLayoutPickerCategoryBinding
) : RecyclerView.ViewHolder(binding.root) {
    fun onBind(uiState: CategoryListItemUiState) {
        binding.category.text = uiState.title
        binding.emoji.text = uiState.emoji
        binding.categoryContainer.contentDescription = parent.context.getString(
                uiState.contentDescriptionResId,
                uiState.title
        )
        binding.categoryContainer.setOnClickListener {
            uiState.onItemTapped.invoke()
        }
        setSelectedStateUI(uiState)
    }

    private fun setSelectedStateUI(uiState: CategoryListItemUiState) {
        binding.check.setVisible(uiState.checkIconVisible)
        binding.emoji.setVisible(uiState.emojiIconVisible)
        binding.categoryContainer.backgroundTintList = parent.context.getColorStateListFromAttribute(uiState.background)
        binding.category.setTextColor(parent.context.getColorFromAttribute(uiState.textColor))
    }

    companion object {
        fun from(parent: ViewGroup): CategoryViewHolder {
            val binding = ModalLayoutPickerCategoryBinding.inflate(
                    LayoutInflater.from(parent.context),
                    parent,
                    false
            )
            return CategoryViewHolder(parent, binding)
        }
    }
}
