
HEADING =
"<h1>Heading 1</h1>" +
        "<h2>Heading 2</h2>" +
        "<h3>Heading 3</h3>" +
        "<h4>Heading 4</h4>" +
        "<h5>Heading 5</h5>" +
        "<h6>Heading 6</h6>";
BOLD = "<b>Bold</b><br>";
ITALIC = "<i style=\"color:darkred\">Italic</i><br>";
UNDERLINE = "<u style=\"color:lime\">Underline</u><br>";
STRIKETHROUGH = "<s style=\"color:#ff666666\" class=\"test\">Strikethrough</s><br>" ;// <s> or <strike> or <del>
ORDERED = "<ol style=\"color:green\"><li>Ordered</li><li>should have color</li></ol>";
LINE = "<hr>";
UNORDERED = "<ul><li style=\"color:darkred\">Unordered</li><li>Should not have color</li></ul>";
QUOTE = "<blockquote>Quote</blockquote>";
LINK = "<a href=\"https://github.com/wordpress-mobile/WordPress-Aztec-Android\">Link</a><br>";
UNKNOWN = "<iframe class=\"classic\">Menu</iframe><br>";
COMMENT = "<!--Comment--><br>";
COMMENT_MORE = "<!--more--><br>";
COMMENT_PAGE = "<!--nextpage--><br>";
HIDDEN =
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
GUTENBERG_CODE_BLOCK = "<!-- wp:core/image {\"id\":316} -->\n" +
"<figure class=\"wp-block-image\"><img src=\"https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/WordPress_blue_logo.svg/1200px-WordPress_blue_logo.svg.png\" alt=\"\" /></figure>\n" +
"<!-- /wp:core/image -->";
PREFORMAT =
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
CODE = "<code>if (Stringue == 5) printf(Stringue)</code><br>";
IMG = "[caption align=\"alignright\"]<img src=\"https://examplebloge.files.wordpress.com/2017/02/3def4804-d9b5-11e6-88e6-d7d8864392e0.png\" />Caption[/caption]";
EMOJI = "&#x1F44D;";
NON_LATIN_TEXT = "测试一个";
LONG_TEXT = "<br><br>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ";
VIDEO = "[video src=\"https://examplebloge.files.wordpress.com/2017/06/d7d88643-88e6-d9b5-11e6-92e03def4804.mp4\"]";
AUDIO = "[audio src=\"https://upload.wikimedia.org/wikipedia/commons/9/94/H-Moll.ogg\"]";
VIDEOPRESS = "[wpvideo OcobLTqC]";
VIDEOPRESS_2 = "[wpvideo OcobLTqC w=640 h=400 autoplay=true html5only=true3]";
QUOTE_RTL = "<blockquote>לְצַטֵט<br>same quote but LTR</blockquote>";

EXAMPLE_CONTENT =
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

export function example_content() {
    return EXAMPLE_CONTENT;
}
    

          
