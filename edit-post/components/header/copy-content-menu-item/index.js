/**
 * WordPress dependencies
 */
import { ClipboardButton, withState } from '@wordpress/components';
import { compose } from '@wordpress/element';
import { query } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

function CopyContentMenuItem( { editedPostContent, hasCopied, setState } ) {
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

export default compose(
	query( ( select ) => ( {
		editedPostContent: select( 'core/editor' ).getEditedPostAttribute( 'content' ),
	} ) ),
	withState( { hasCopied: false } )
)( CopyContentMenuItem );
