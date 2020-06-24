package org.wordpress.mobile.WPAndroidGlue;

public class UnsupportedBlock {

    private String mId;
    private String mName;
    private String mContent;

    public UnsupportedBlock(String id, String name, String content) {
        mId = id;
        mName = name;
        mContent = content;
    }

    public String getId() {
        return mId;
    }

    public String getName() {
        return mName;
    }

    public String getContent() {
        return mContent;
    }
}
