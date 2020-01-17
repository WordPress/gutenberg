package org.wordpress.mobile.WPAndroidGlue;

import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;

public class MediaOption {

    private static final String KEY_VALUE = "value";
    private static final String KEY_LABEL = "label";

    private String mId;
    private String mName;

    public MediaOption(String id, String name) {
        mId = id;
        mName = name;
    }

    public String getId() {
        return mId;
    }

    public String getName() {
        return mName;
    }

    public WritableMap toMap() {
        WritableMap map = new WritableNativeMap();
        map.putString(KEY_VALUE, mId);
        map.putString(KEY_LABEL, mName);
        return map;
    }
}
