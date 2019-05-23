/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getBlockFocusableWrapper } from '../../utils/dom';

const SkipToSelectedBlock = ( { selectedBlockClientId } ) => {
	const onClick = () => {
		const selectedBlockElement = getBlockFocusableWrapper( selectedBlockClientId );
		selectedBlockElement.focus();
	};

	return (
		selectedBlockClientId &&
		<Button isDefault type="button" className="editor-skip-to-selected-block block-editor-skip-to-selected-block" onClick={ onClick }>
			{ __( 'Skip to the selected block' ) }
		</Button>
	);
};

export default withSelect( ( select ) => {
	return {
		selectedBlockClientId: select( 'core/block-editor' ).getBlockSelectionStart(),
	};
} )( SkipToSelectedBlock );
