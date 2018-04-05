package com.example.android.ReactAztec;

import android.content.Context;
import android.util.AttributeSet;
import android.widget.RelativeLayout;

public class ReactAztecView extends RelativeLayout {
    private ReactAztecText aztecText;

    public ReactAztecView(Context ctx) {
        super(ctx);
    }

    public ReactAztecView(Context ctx, AttributeSet attrs) {
        super(ctx, attrs);
    }

    ReactAztecText getAztecText() {
        return aztecText;
    }

    void setAztecText(ReactAztecText aztecText) {
        this.aztecText = aztecText;
    }
}
