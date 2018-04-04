package com.example.android.ReactAztec;

import android.content.Context;
import android.widget.RelativeLayout;

public class ReactAztecView extends RelativeLayout {
    private ReactAztecText aztecText;

    ReactAztecView(Context ctx) {
        super(ctx);
    }

    public ReactAztecText getAztecText() {
        return aztecText;
    }

    public void setAztecText(ReactAztecText aztecText) {
        this.aztecText = aztecText;
        this.addView(aztecText);
    }
}
