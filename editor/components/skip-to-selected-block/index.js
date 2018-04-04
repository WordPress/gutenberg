/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal Dependencies
 */
import './style.scss';
import { getBlockFocusableWrapper } from '../../utils/dom';

const SkipToSelectedBlock = ( { selectedBlockUID } ) => {
	const onClick = () => {
		const selectedBlockElement = getBlockFocusableWrapper( selectedBlockUID );
		selectedBlockElement.focus();
	};

	return (
		selectedBlockUID &&
		<button type="button" className="button editor-skip-to-selected-block" onClick={ onClick }>
			{ __( 'Skip to the selected block' ) }
		</button>
	);
};

export default withSelect( ( select ) => {
	return {
		selectedBlockUID: select( 'core/editor' ).getBlockSelectionStart(),
	};
} )( SkipToSelectedBlock );
