package com.gutenberg

import android.view.View
import javax.inject.Inject

class UiHelpers @Inject constructor() {
    /**
     * Sets the [firstView] visible and the [secondView] invisible with a fade in/out animation and vice versa
     * @param visible if true the [firstView] is shown and the [secondView] is hidden else the other way round
     */
    fun fadeInfadeOutViews(firstView: View?, secondView: View?, visible: Boolean) {
        if (firstView == null || secondView == null || visible == (firstView.visibility == View.VISIBLE)) return
        if (visible) {
            AniUtils.fadeIn(firstView, AniUtils.Duration.SHORT)
            AniUtils.fadeOut(secondView, AniUtils.Duration.SHORT, View.INVISIBLE)
        } else {
            AniUtils.fadeIn(secondView, AniUtils.Duration.SHORT)
            AniUtils.fadeOut(firstView, AniUtils.Duration.SHORT, View.INVISIBLE)
        }
    }
}
