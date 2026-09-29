// Base styles for the content rendered within the BlockCanvas iframe.
import componentsStyles from '@wordpress/components/build-style/style.css?raw';
import componentsStylesRtl from '@wordpress/components/build-style/style-rtl.css?raw';
import blockEditorContentStyles from '@wordpress/block-editor/build-style/content.css?raw';
import blockEditorContentStylesRtl from '@wordpress/block-editor/build-style/content-rtl.css?raw';
import blockLibraryStyles from '@wordpress/block-library/build-style/style.css?raw';
import blockLibraryStylesRtl from '@wordpress/block-library/build-style/style-rtl.css?raw';
import blockLibraryEditorStyles from '@wordpress/block-library/build-style/editor.css?raw';
import blockLibraryEditorStylesRtl from '@wordpress/block-library/build-style/editor-rtl.css?raw';

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

/**
 * Styles to pass to `BlockCanvas`, keyed by the Storybook text direction.
 */
export const contentStyles = {
	ltr: [
		{ css: componentsStyles },
		{ css: blockEditorContentStyles },
		{ css: blockLibraryStyles },
		{ css: blockLibraryEditorStyles },
		...editorStyles,
	],
	rtl: [
		{ css: componentsStylesRtl },
		{ css: blockEditorContentStylesRtl },
		{ css: blockLibraryStylesRtl },
		{ css: blockLibraryEditorStylesRtl },
		...editorStyles,
	],
};
