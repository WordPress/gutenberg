exports.shortText = `Hello Gutenberg! My name is Appium`;

exports.longText = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam luctus velit et nunc tristique, ut tincidunt ipsum placerat. Maecenas placerat nec elit sit amet vulputate. 
Nam suscipit dolor eu arcu efficitur, nec faucibus sapien ullamcorper. Etiam nibh risus, tincidunt quis purus a, dictum porta dui. Phasellus lacinia iaculis odio, et eleifend d
Nullam suscipit volutpat velit eget varius. Etiam diam ex, finibus eu turpis a, semper tempus ante. Vestibulum quis elit et felis sagittis mollis.
Nullam porta aliquam nisi, eu dapibus mauris dignissim at. Praesent ut congue sem. Nullam a rhoncus metus.`;

exports.listItem1 = `Milk`;
exports.listItem2 = `Honey`;
exports.listHtml = `<!-- wp:list -->
<ul><li>Milk</li><li>Honey</li></ul>
<!-- /wp:list -->`;
exports.listEndedHtml = `<!-- wp:list -->
<ul><li>Milk</li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p></p>
<!-- /wp:paragraph -->`;

exports.pastePlainText = `Hello paste`;

const pastedHtmlText = `<!-- wp:paragraph -->
<p><strong>Hello</strong> paste</p>
<!-- /wp:paragraph -->`;

exports.pasteHtmlText = pastedHtmlText;

exports.pasteHtmlTextResult = `${ pastedHtmlText }\n\n${ pastedHtmlText }`;
