/**
 * WordPress dependencies
 */
import { ClipboardButton, withState } from '@wordpress/components';
import { compose } from '@wordpress/element';
import { query } from '@wordpress/data';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

function CopyContentButton( { editedPostContent, hasCopied, setState } ) {
	return (
		<ClipboardButton
			text={ editedPostContent }
			className="components-menu-items__button"
			onCopy={ () => setState( { hasCopied: true } ) }
			onFinishCopy={ () => setState( { hasCopied: false } ) }
		>
			{ hasCopied ?
				__( 'Copied!' ) :
				__( 'Copy All Content' ) }
		</ClipboardButton>
	);
}

const Enhanced = compose(
	query( ( select ) => ( {
		editedPostContent: select( 'core/editor' ).getEditedPostAttribute( 'content' ),
	} ) ),
	withState( { hasCopied: false } )
)( CopyContentButton );

const buttonElement = <Enhanced key="copy-content-button" />;

addFilter(
	'editor.EditorActions.tools',
	'core/copy-content/button',
	( children ) => [ ...children, buttonElement ]
);
