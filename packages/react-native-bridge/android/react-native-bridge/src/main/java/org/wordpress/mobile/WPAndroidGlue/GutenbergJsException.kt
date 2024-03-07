package org.wordpress.mobile.WPAndroidGlue

import com.facebook.react.bridge.ReadableMap

data class JsExceptionStackTraceElement (
    val fileName: String?,
    val lineNumber: Int?,
    val colNumber: Int?,
    val function: String,
)
class GutenbergJsException (
    val type: String,
    val message: String,
    var stackTrace: List<JsExceptionStackTraceElement>,
    val context: Map<String, Any> = emptyMap(),
    val tags: Map<String,String> = emptyMap(),
    val isHandled: Boolean,
    val handledBy: String
) {

    companion object {
        @JvmStatic
        fun fromReadableMap(rawException: ReadableMap): GutenbergJsException {
            val type: String = rawException.getString("type") ?: ""
            val message: String = rawException.getString("message") ?: ""

            val stackTrace: List<JsExceptionStackTraceElement> = rawException.getArray("stacktrace")?.let {
                (0 until it.size()).mapNotNull { index ->
                    val stackTraceElement = it.getMap(index)
                    stackTraceElement?.let {
                        val stackTraceFunction = stackTraceElement.getString("function")
                        stackTraceFunction?.let {
                            JsExceptionStackTraceElement(
                                stackTraceElement.getString("filename"),
                                if (stackTraceElement.hasKey("lineno")) stackTraceElement.getInt("lineno") else null,
                                if (stackTraceElement.hasKey("colno")) stackTraceElement.getInt("colno") else null,
                                stackTraceFunction
                            )
                        }
                    }
                }
            } ?: emptyList()

            val context: Map<String, Any> = rawException.getMap("context")?.toHashMap() ?: emptyMap()
            val tags: Map<String, String> = rawException.getMap("tags")?.toHashMap()?.mapValues { it.value.toString() } ?: emptyMap()
            val isHandled: Boolean = rawException.getBoolean("isHandled")
            val handledBy: String = rawException.getString("handledBy") ?: ""

            return GutenbergJsException(
                type,
                message,
                stackTrace,
                context,
                tags,
                isHandled,
                handledBy
            )
        }
    }
}

