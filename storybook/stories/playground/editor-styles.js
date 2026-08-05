// Base styles for the content rendered within the BlockCanvas iframe.
// Reason: Styles are contained in the BlockCanvas iframe.
// eslint-disable-next-line @wordpress/no-non-module-stylesheet-imports
import componentsStyles from '@wordpress/components/build-style/style.css?raw';
// eslint-disable-next-line @wordpress/no-non-module-stylesheet-imports
import blockEditorContentStyles from '@wordpress/block-editor/build-style/content.css?raw';
// eslint-disable-next-line @wordpress/no-non-module-stylesheet-imports
import blockLibraryStyles from '@wordpress/block-library/build-style/style.css?raw';
// eslint-disable-next-line @wordpress/no-non-module-stylesheet-imports
import blockLibraryEditorStyles from '@wordpress/block-library/build-style/editor.css?raw';

export const blockLibraryContentStyles = [
	{ css: componentsStyles },
	{ css: blockEditorContentStyles },
	{ css: blockLibraryStyles },
	{ css: blockLibraryEditorStyles },
];

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
