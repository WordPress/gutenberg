/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from 'i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import Inserter from '../../inserter';
import VisualEditorBlock from './block';
import PostTitle from '../../post-title';
import { getBlockUids } from '../../selectors';

function VisualEditor( { blocks, clearSelectedBlock } ) {
	// Disable reason: Focus transfer between blocks and key events are handled
	// by focused block element. Consider unhandled click bubbling as unselect.

	/* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */
	return (
		<div
			role="region"
			aria-label={ __( 'Visual Editor' ) }
			onClick={ clearSelectedBlock }
			className="editor-visual-editor">
			<PostTitle />
			{ blocks.map( ( uid ) => (
				<VisualEditorBlock key={ uid } uid={ uid } />
			) ) }
			<Inserter position="top right" />
		</div>
	);
	/* eslint-enable jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */
}

export default connect(
	( state ) => ( {
		blocks: getBlockUids( state ),
	} ),
	( dispatch ) => ( {
		clearSelectedBlock: () => dispatch( { type: 'CLEAR_SELECTED_BLOCK' } ),
	} )
)( VisualEditor );
