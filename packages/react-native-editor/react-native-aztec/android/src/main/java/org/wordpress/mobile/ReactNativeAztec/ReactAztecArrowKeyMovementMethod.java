package org.wordpress.mobile.ReactNativeAztec;

import android.text.Selection;
import android.text.Spannable;
import android.text.method.ArrowKeyMovementMethod;
import android.view.View;
import android.widget.TextView;

public class ReactAztecArrowKeyMovementMethod extends ArrowKeyMovementMethod {

    @Override
    public void onTakeFocus(TextView view, Spannable text, int dir) {
        if ((dir & (View.FOCUS_FORWARD | View.FOCUS_DOWN)) != 0) {
            if (view.getLayout() == null) {
                Selection.setSelection(text, 0); // <-- setting caret to end of text
            }
        } else {
            Selection.setSelection(text, text.length());  // <-- same as original Android implementation. Not sure if we should change this too
        }
    }
}
