package org.wordpress.mobile.ReactNativeGutenbergBridge

import com.facebook.react.bridge.ReadableMap

data class GutenbergJsException(
    var type: String,
    var value: String,
    var stackTrace: List<GutenbergJsExceptionStackTraceElement>,
    var context: Map<String, Any> = emptyMap(),
    var tags: Map<String,String> = emptyMap(),
    var isHandled: Boolean,
    var handledBy: String
){
    companion object {
        @JvmStatic
        fun fromReadableMap(rawException: ReadableMap): GutenbergJsException {
            val type: String = rawException.getString("type") ?: ""
            val value: String = rawException.getString("value") ?: ""
            val stackTrace: List<GutenbergJsExceptionStackTraceElement> = rawException.getArray("stackTrace")?.toArrayList()?.map {
                val stackTraceElement = it as ReadableMap
                GutenbergJsExceptionStackTraceElement(
                    stackTraceElement.getString("fileName") ?: "",
                    stackTraceElement.getInt("lineNumber"),
                    stackTraceElement.getString("function") ?: ""
                )
            } ?: emptyList()
            val context: Map<String, Any> = rawException.getMap("context")?.toHashMap() ?: emptyMap()
            val tags: Map<String, String> = rawException.getMap("tags")?.toHashMap()?.mapValues { it.value.toString() } ?: emptyMap()
            val isHandled: Boolean = rawException.getBoolean("isHandled")
            val handledBy: String = rawException.getString("handledBy") ?: ""

            return GutenbergJsException(
                type,
                value,
                stackTrace,
                context,
                tags,
                isHandled,
                handledBy
            )
        }
    }
}

data class GutenbergJsExceptionStackTraceElement(
    var fileName: String,
    var lineNumber: Int,
    var function: String
)
