package org.wordpress.mobile.WPAndroidGlue;

import androidx.annotation.NonNull;

import org.wordpress.mobile.ReactNativeGutenbergBridge.GutenbergBridgeJS2Parent.MediaType;
import org.wordpress.mobile.ReactNativeGutenbergBridge.GutenbergBridgeJS2Parent.RNMedia;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;

import java.util.Locale;

public class Media implements RNMedia {
    private int mId;
    private String mUrl;
    private String mType;
    private String mCaption;

    public Media(int id, String url, String type, String caption) {
        this.mId = id;
        this.mUrl = url;
        this.mType = type;
        this.mCaption = caption;
    }

    public Media(int id, String url) {
        this.mId = id;
        this.mUrl = url;
        this.mType = "";
        this.mCaption = "";
    }

    public static Media createRNMediaUsingMimeType(final int id, final String url, @NonNull final String mimeType, final String caption) {
        String type;

        if (mimeType.startsWith(MediaType.IMAGE.name().toLowerCase(Locale.ROOT))) {
            type =  MediaType.IMAGE.name().toLowerCase(Locale.ROOT);
        } else if (mimeType.startsWith(MediaType.VIDEO.name().toLowerCase(Locale.ROOT))) {
            type =  MediaType.VIDEO.name().toLowerCase(Locale.ROOT);
        } else {
            type = MediaType.OTHER.name().toLowerCase(Locale.ROOT);
        }

        return new Media(id, url, type, caption);
    }


    public int getId() {
        return mId;
    }

    public void setId(int id) {
        this.mId = id;
    }

    public String getUrl() {
        return mUrl;
    }

    public void setUrl(String url) {
        this.mUrl = url;
    }

    public String getType() {
        return mType;
    }

    public void setType(String mediaType) {
        this.mType = mediaType;
    }

    public String getCaption() {
        return mCaption;
    }

    public void setCaption(String caption) {
        this.mCaption = caption;
    }

    public WritableMap toMap() {
        WritableMap map = new WritableNativeMap();
        map.putInt("id", mId);
        map.putString("url", mUrl);
        map.putString("type", mType);
        map.putString("caption", mCaption);
        return map;
    }
}
