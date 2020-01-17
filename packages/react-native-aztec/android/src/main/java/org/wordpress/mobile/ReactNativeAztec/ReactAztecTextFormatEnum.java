package org.wordpress.mobile.ReactNativeAztec;

import org.wordpress.aztec.AztecTextFormat;

import java.util.HashMap;
import java.util.Map;

public enum ReactAztecTextFormatEnum {

    P("p", AztecTextFormat.FORMAT_PARAGRAPH),
    H1("h1", AztecTextFormat.FORMAT_HEADING_1),
    H2("h2", AztecTextFormat.FORMAT_HEADING_2),
    H3("h3", AztecTextFormat.FORMAT_HEADING_3),
    H4("h4", AztecTextFormat.FORMAT_HEADING_4),
    H5("h5", AztecTextFormat.FORMAT_HEADING_5),
    H6("h6", AztecTextFormat.FORMAT_HEADING_6),
    PRE("pre", AztecTextFormat.FORMAT_PREFORMAT);

    private final String mTag;
    private final AztecTextFormat mAztecTextFormat;

    private static final Map<String, ReactAztecTextFormatEnum> lookup = new HashMap<>();

    static {
        for (ReactAztecTextFormatEnum value : ReactAztecTextFormatEnum.values()) {
            lookup.put(value.mTag, value);
        }
    }

    ReactAztecTextFormatEnum(String tag, AztecTextFormat aztecTextFormat) {
        mTag = tag;
        mAztecTextFormat = aztecTextFormat;
    }

    public AztecTextFormat getAztecTextFormat() {
        return mAztecTextFormat;
    }

    static ReactAztecTextFormatEnum get(String tag) {
        return lookup.get(tag);
    }
}
