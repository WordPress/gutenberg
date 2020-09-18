package org.wordpress.mobile.ReactNativeGutenbergBridge

import com.facebook.react.bridge.WritableMap

interface RNMedia {
    val url: String
    val id: Int
    val type: String
    val caption: String
    fun toMap(): WritableMap
}
