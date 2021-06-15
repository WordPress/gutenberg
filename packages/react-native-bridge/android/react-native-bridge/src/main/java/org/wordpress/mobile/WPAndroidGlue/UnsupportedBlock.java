package org.wordpress.mobile.WPAndroidGlue;

public class UnsupportedBlock {

    private String mId;
    private String mName;
    private String mTitle;
    private String mContent;

    public UnsupportedBlock(String id, String name, String title, String content) {
        mId = id;
        mName = name;
        mTitle = title;
        mContent = content;
    }

    public String getId() {
        return mId;
    }

    public String getName() {
        return mName;
    }

    public String getTitle() {
        return mTitle;
    }

    public String getContent() {
        return mContent;
    }
}
