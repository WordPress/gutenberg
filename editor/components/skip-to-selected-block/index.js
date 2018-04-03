/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal Dependencies
 */
import './style.scss';
import { getBlockWrapperDOMNode } from '../../utils/dom';

const SkipToSelectedBlock = ( { selectedBlock } ) => {
	if ( ! selectedBlock ) {
		return null;
	}

	const { uid } = selectedBlock;

	const onClick = () => {
		const selectedBlockElement = getBlockWrapperDOMNode( uid );
		selectedBlockElement.focus();
	};

	return (
		selectedBlock && uid &&
		<button type="button" className="button skip-to-selected-block" onClick={ onClick }>
			{ __( 'Skip to the selected block' ) }
		</button>
	);
};

export default withSelect( ( select ) => {
	return {
		selectedBlock: select( 'core/editor' ).getSelectedBlock(),
	};
} )( SkipToSelectedBlock );
