package com.reactnativesimplejsi;

import android.content.SharedPreferences;
import android.os.Build;
import android.preference.PreferenceManager;
import android.util.Log;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.JavaScriptContextHolder;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.bridge.ReactMethod;

@ReactModule(name = SimpleJsiModule.NAME)
public class SimpleJsiModule extends ReactContextBaseJavaModule {
  public static final String NAME = "SimpleJsi";

  private long contextHolder;
  private String contextPath;

  private native void nativeInstall(long jsiPtr, String docDir);
  private native void nativeSendEvent(long jsiPtr, int viewId, String eventName, String content, int selectionStart, int selectionEnd, long timestamp);

  public SimpleJsiModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  @NonNull
  public String getName() {
    return NAME;
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  public boolean install() {
    try {
      System.loadLibrary("cpp");

      ReactApplicationContext context = getReactApplicationContext();
      contextHolder = context.getJavaScriptContextHolder().get();
      contextPath = context.getFilesDir().getAbsolutePath();

      nativeInstall(contextHolder,contextPath);
      return true;
    } catch (Exception exception) {
      return false;
    }
  }

  public void sendEvent(int viewId, String eventName, String text, int selectionStart, int selectionEnd, long timestamp) {
      nativeSendEvent(getReactApplicationContext().getJavaScriptContextHolder().get(), viewId, eventName, text, selectionStart, selectionEnd, timestamp);
  }
}
