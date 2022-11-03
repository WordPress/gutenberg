/**
 * WordPress dependencies
 */
import {
	__unstableIframe as Iframe,
    __unstableEditorStyles as EditorStyles,
} from '@wordpress/block-editor';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useGlobalStylesOutput } from './use-global-styles-output';
import { useStyle } from './hooks';

// const normalizedWidth = 248;
const normalizedHeight = 152;


// // NOTE: This is a very early prototype component to show preview of a block
// it is created for the purpose of previewing box-shadow
// and will eventually be replaced when https://github.com/WordPress/gutenberg/issues/42919 is complete 
const BlockPreview = ( { label, name } ) => {
    const [ styles ] = useGlobalStylesOutput();
    const editorStyles = useMemo( () => {
		if ( styles ) {
			return [
				...styles,
				{
					css: 'html{overflow:hidden}body{min-width: 0;padding: 0;border: none}',
					isGlobalStyles: true,
				}
			];
		}

		return styles;
	}, [ styles ] );

    const wrapperStyles = {
        position: 'absolute',
        top: '0',
        height: '100%',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    };

    // get the styles to render the preview
    let blockStyles = { padding: '0.5rem 1rem', border: '1px solid' };
    const [ shadow ] = useStyle( 'shadow', name );
    blockStyles = { ...blockStyles, boxShadow: shadow };

    return <>
        <Iframe
            className="edit-site-block-styles-preview__iframe"
            head={ <EditorStyles styles={editorStyles} /> }
            style={ {
                height: normalizedHeight * 1,
                visibility: 'visible',
            } }
            tabIndex={ -1 }
        >
            <div style={wrapperStyles}>
                <p style={blockStyles}>{ label || 'Preview' }</p>
            </div>
        </Iframe>
    </>
}

export default BlockPreview;
