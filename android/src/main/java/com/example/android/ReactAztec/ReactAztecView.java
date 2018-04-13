package com.example.android.ReactAztec;

import android.content.Context;
import android.util.AttributeSet;
import android.widget.RelativeLayout;

import org.wordpress.aztec.source.SourceViewEditText;
import org.wordpress.aztec.toolbar.AztecToolbar;

public class ReactAztecView extends RelativeLayout {
    private ReactAztecText mAztecText;
    private SourceViewEditText mSourceEditor;
    private AztecToolbar mToolbar;

    public ReactAztecView(Context ctx) {
        super(ctx);
    }

    public ReactAztecView(Context ctx, AttributeSet attrs) {
        super(ctx, attrs);
    }

    ReactAztecText getAztecText() {
        return mAztecText;
    }

    void setAztecText(ReactAztecText aztecText) {
        this.mAztecText = aztecText;
    }

    public SourceViewEditText getSourceEditor() {
        return mSourceEditor;
    }

    public void setSourceEditor(SourceViewEditText mSourceEditor) {
        this.mSourceEditor = mSourceEditor;
    }

    public AztecToolbar getToolbar() {
        return mToolbar;
    }

    public void setToolbar(AztecToolbar mToolbar) {
        this.mToolbar = mToolbar;
    }
}
