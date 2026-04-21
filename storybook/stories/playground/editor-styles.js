export const editorStyles = [
	{
		css: `
        body {
            font-family: Arial;
            font-size: 16px;
        }
        p {
            font-size: inherit;
            line-height: inherit;
        }
        ul,
        ol {
            margin: 0;
            padding: 0;
        }
    
        ul li,
        ol li {
            margin-bottom: initial;
        }
    
        ul {
            list-style-type: disc;
        }
    
        ol {
            list-style-type: decimal;
        }
    
        ul ul,
        ol ul {
            list-style-type: circle;
        }
    
        .wp-block {
            max-width: 700px;    
            margin-left: auto;
            margin-right: auto;
        }
        .wp-block[data-align="wide"],
        .wp-block.alignwide {
            max-width: 900px;
        }
        .wp-block[data-align="full"],
        .wp-block.alignfull {
            max-width: none;
        }
        `,
	},
];
