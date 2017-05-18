/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { cond } from 'lodash';

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

/**
 * Returns true if the key pressed is the escape key, or false otherwise.
 *
 * @param  {KeyboardEvent} event Key event to test
 * @return {Boolean}             Whether event is escape key press
 */
function isEscapeKey( event ) {
	return 27 /* Escape */ === event.keyCode;
}

function VisualEditor( { blocks, clearSelectedBlock } ) {
	// Disable reason: Focus transfers between blocks are handled by focusable
	// block elements. Capture unhandled event bubbling as unselect intent.

	/* eslint-disable jsx-a11y/no-static-element-interactions */
	return (
		<div
			role="region"
			aria-label={ __( 'Visual Editor' ) }
			onKeyPress={ cond( [ [ isEscapeKey, clearSelectedBlock ] ] ) }
			onClick={ clearSelectedBlock }
			className="editor-visual-editor">
			<PostTitle />
			{ blocks.map( ( uid ) => (
				<VisualEditorBlock key={ uid } uid={ uid } />
			) ) }
			<Inserter position="top right" />
		</div>
	);
	/* eslint-enable jsx-a11y/no-static-element-interactions */
}

export default connect(
	( state ) => ( {
		blocks: getBlockUids( state ),
	} ),
	( dispatch ) => ( {
		clearSelectedBlock: () => dispatch( { type: 'CLEAR_SELECTED_BLOCK' } ),
	} )
)( VisualEditor );
