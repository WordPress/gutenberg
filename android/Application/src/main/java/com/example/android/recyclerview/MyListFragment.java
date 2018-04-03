package com.example.android.recyclerview;

import android.app.Activity;
import android.os.Bundle;
import android.support.v4.app.Fragment;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import com.example.android.common.activities.SampleActivityBase;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactRootView;

public class MyListFragment extends Fragment {

    private static final String TAG = "MyListFragment";

    private ReactInstanceManager mReactInstanceManager;

    @Override
    public void onAttach(Activity activity) {
        super.onAttach(activity);
        try {
            mReactInstanceManager = ((SampleActivityBase) activity).getReactInstanceManager();
        } catch (ClassCastException e) {
            throw new ClassCastException(activity.toString() + " must extends SampleActivityBase");
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        if (mReactInstanceManager == null) {
            try {
                mReactInstanceManager = ((SampleActivityBase) getActivity()).getReactInstanceManager();
            } catch (ClassCastException e) {
                throw new ClassCastException(getActivity().toString() + " must extends SampleActivityBase");
            }
        }

        ReactRootView reactRootView = new ReactRootView(getContext());
        Bundle RNPropos = new Bundle();
        RNPropos.putString("text", EXAMPLE);
        reactRootView.startReactApplication(mReactInstanceManager, "SimpleTextInput", RNPropos);
        return reactRootView;
    }

    @Override
    public void onSaveInstanceState(Bundle savedInstanceState) {
        super.onSaveInstanceState(savedInstanceState);
    }

    private String HEADING =
            "<h1>Heading 1</h1>" +
                    "<h2>Heading 2</h2>" +
                    "<h3>Heading 3</h3>" +
                    "<h4>Heading 4</h4>" +
                    "<h5>Heading 5</h5>" +
                    "<h6>Heading 6</h6>";
    private String BOLD = "<b>Bold</b><br>";
    private String ITALIC = "<i style=\"color:darkred\">Italic</i><br>";
    private String UNDERLINE = "<u style=\"color:lime\">Underline</u><br>";
    private String STRIKETHROUGH = "<s style=\"color:#ff666666\" class=\"test\">Strikethrough</s><br>" ;// <s> or <strike> or <del>
    private String ORDERED = "<ol style=\"color:green\"><li>Ordered</li><li>should have color</li></ol>";
    private String LINE = "<hr>";
    private String UNORDERED = "<ul><li style=\"color:darkred\">Unordered</li><li>Should not have color</li></ul>";
    private String QUOTE = "<blockquote>Quote</blockquote>";
    private String LINK = "<a href=\"https://github.com/wordpress-mobile/WordPress-Aztec-Android\">Link</a><br>";
    private String UNKNOWN = "<iframe class=\"classic\">Menu</iframe><br>";
    private String COMMENT = "<!--Comment--><br>";
    private String COMMENT_MORE = "<!--more--><br>";
    private String COMMENT_PAGE = "<!--nextpage--><br>";
    private String HIDDEN =
            "<span></span>" +
                    "<div class=\"first\">" +
                    "    <div class=\"second\">" +
                    "        <div class=\"third\">" +
                    "            Div<br><span><b>Span</b></span><br>Hidden" +
                    "        </div>" +
                    "        <div class=\"fourth\"></div>" +
                    "        <div class=\"fifth\"></div>" +
                    "    </div>" +
                    "    <span class=\"second last\"></span>" +
                    "</div>" +
                    "<br>";
    private String GUTENBERG_CODE_BLOCK = "<!-- wp:core/image {\"id\":316} -->\n" +
            "<figure class=\"wp-block-image\"><img src=\"https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/WordPress_blue_logo.svg/1200px-WordPress_blue_logo.svg.png\" alt=\"\" /></figure>\n" +
            "<!-- /wp:core/image -->";
    private String PREFORMAT =
            "<pre>" +
                    "when (person) {<br>" +
                    "    MOCTEZUMA -> {<br>" +
                    "        print (\"friend\")<br>" +
                    "    }<br>" +
                    "    CORTES -> {<br>" +
                    "        print (\"foe\")<br>" +
                    "    }<br>" +
                    "}" +
                    "</pre>";
    private String CODE = "<code>if (Stringue == 5) printf(Stringue)</code><br>";
    private String IMG = "[caption align=\"alignright\"]<img src=\"https://examplebloge.files.wordpress.com/2017/02/3def4804-d9b5-11e6-88e6-d7d8864392e0.png\" />Caption[/caption]";
    private String EMOJI = "&#x1F44D;";
    private String NON_LATIN_TEXT = "测试一个";
    private String LONG_TEXT = "<br><br>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ";
    private String VIDEO = "[video src=\"https://examplebloge.files.wordpress.com/2017/06/d7d88643-88e6-d9b5-11e6-92e03def4804.mp4\"]";
    private String AUDIO = "[audio src=\"https://upload.wikimedia.org/wikipedia/commons/9/94/H-Moll.ogg\"]";
    private String VIDEOPRESS = "[wpvideo OcobLTqC]";
    private String VIDEOPRESS_2 = "[wpvideo OcobLTqC w=640 h=400 autoplay=true html5only=true3]";
    private String QUOTE_RTL = "<blockquote>לְצַטֵט<br>same quote but LTR</blockquote>";

    private String EXAMPLE =
            IMG +
                    HEADING +
                    BOLD +
                    ITALIC +
                    UNDERLINE +
                    STRIKETHROUGH +
                    ORDERED +
                    LINE +
                    UNORDERED +
                    QUOTE +
                    PREFORMAT +
                    LINK +
                    HIDDEN +
                    COMMENT +
                    COMMENT_MORE +
                    COMMENT_PAGE +
                    CODE +
                    UNKNOWN +
                    EMOJI +
                    NON_LATIN_TEXT +
                    LONG_TEXT +
                    VIDEO +
                    VIDEOPRESS +
                    VIDEOPRESS_2 +
                    AUDIO +
                    GUTENBERG_CODE_BLOCK +
                    QUOTE_RTL;
}
