package com.gutenberg

import android.util.Log
import android.view.Choreographer
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.core.view.children
import androidx.fragment.app.FragmentActivity
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.common.MapBuilder
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.annotations.ReactPropGroup
import java.lang.ref.WeakReference

class PatternPickerViewManager(val reactContext: ReactApplicationContext):
    ViewGroupManager<FrameLayout>() {
    val COMMAND_CREATE = 1
    private var propWidth: Int = 0
    private var propHeight: Int = 0

    override fun getName(): String {
        return REACT_CLASS
    }
    companion object {
        @JvmStatic
        val REACT_CLASS = "PatternPickerViewManager"
    }

    override fun createViewInstance(reactContext: ThemedReactContext): FrameLayout {
        return FrameLayout(reactContext)
    }

    override fun getCommandsMap(): MutableMap<String, Int> {
        return MapBuilder.of("create", COMMAND_CREATE)
    }

    override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any> {
        return MapBuilder.of(
            "onPatternPicked",
            MapBuilder.of("registration", "onPatternPicked")
        )
    }

    override fun receiveCommand(root: FrameLayout, commandId: String?, args: ReadableArray?) {
        super.receiveCommand(root, commandId, args)
        if (commandId == null || args == null) return
        val reactNativeViewId = args.getInt(0)
        Log.d("nativeViewId", reactNativeViewId.toString())
        val commandIdInt = Integer.parseInt(commandId)

        when (commandIdInt) {
            COMMAND_CREATE -> createFragment(root, reactNativeViewId)
        }
    }

    @ReactPropGroup(names = ["width", "height"], customType = "Style")
    fun setStyle(view: FrameLayout, index: Int, value: Int) {
        if (index == 0) {
            propWidth = value
        }

        if (index == 1) {
            propHeight = value
        }

    }

    fun createFragment(root: FrameLayout, reactNativeViewId: Int) {
        val parentView = root.findViewById<ViewGroup>(reactNativeViewId)
        setupLayout(parentView)

        val patternPickerFragment = ModalLayoutPickerFragment()
        patternPickerFragment.reactContext = WeakReference(reactContext)
        val activity = reactContext.currentActivity as FragmentActivity
        activity.supportFragmentManager
            .beginTransaction()
            .replace(reactNativeViewId, patternPickerFragment, reactNativeViewId.toString())
            .commit()
    }

    fun setupLayout(view: View) {
        Choreographer.getInstance().postFrameCallback(object: Choreographer.FrameCallback {
            override fun doFrame(p0: Long) {
                manuallyLayoutChildren(view)
                view.viewTreeObserver.dispatchOnGlobalLayout()
                Choreographer.getInstance().postFrameCallback(this)
            }
        })
    }

    fun manuallyLayoutChildren(view: View) {
        val width = propWidth
        val height = propHeight

        view.measure(
            View.MeasureSpec.makeMeasureSpec(width, View.MeasureSpec.EXACTLY),
            View.MeasureSpec.makeMeasureSpec(height, View.MeasureSpec.EXACTLY)
        )

        view.layout(0, 0, width, height)
//        view.children.forEach {
//            it.measure(
//                View.MeasureSpec.makeMeasureSpec(view.measuredWidth, View.MeasureSpec.EXACTLY),
//                View.MeasureSpec.makeMeasureSpec(view.measuredHeight, View.MeasureSpec.EXACTLY)
//            )
//            it.layout(0, 0, it.measuredWidth, it.measuredHeight)
//        }
    }
}
