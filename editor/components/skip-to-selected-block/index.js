/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal Dependencies
 */
import './style.scss';
import { getSelectedBlock } from '../../store/selectors';
import { getBlockWrapperDOMNode } from '../../utils/dom';

const SkipToSelectedBlock = ( { selectedBlock } ) => {
	if ( ! selectedBlock ) {
		return <span className="editor-skip-to-selected-block__no-blocks">{ __( 'No block selected.' ) }</span>;
	}

	const { uid } = selectedBlock;

	const onClick = () => {
		const selectedBlockElement = getBlockWrapperDOMNode( uid );
		selectedBlockElement.focus();
	};

	return (
		uid &&
		<button type="button" className="button editor-skip-to-selected-block screen-reader-shortcut" onClick={ onClick }>
			{ __( 'Skip to the selected block' ) }
		</button>
	);
};

export default connect(
	( state ) => {
		return {
			selectedBlock: getSelectedBlock( state ),
		};
	}
)( SkipToSelectedBlock );
