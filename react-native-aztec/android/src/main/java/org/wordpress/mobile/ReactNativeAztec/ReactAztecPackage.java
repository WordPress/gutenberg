package org.wordpress.mobile.ReactNativeAztec;

import androidx.core.util.Consumer;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class ReactAztecPackage implements ReactPackage {

    private final Consumer<Exception> exceptionLogger;
    private final Consumer<String> breadcrumbLogger;

    public ReactAztecPackage(Consumer<Exception> exceptionLogger, Consumer<String> breadcrumbLogger) {
        this.exceptionLogger = exceptionLogger;
        this.breadcrumbLogger = breadcrumbLogger;
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        List<ViewManager> views = new ArrayList<>();
        views.add(new ReactAztecManager(exceptionLogger, breadcrumbLogger));
        return views;
    }

    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }

}