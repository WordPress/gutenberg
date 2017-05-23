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
import { getBlockUids, getBlockInsertionPoint } from '../../selectors';

const INSERTION_POINT_PLACEHOLDER = '[[insertion-point]]';

function VisualEditor( { blocks, insertionPoint, clearSelectedBlock } ) {
	const insertionPointIndex = blocks.indexOf( insertionPoint );
	const blocksWithInsertionPoint = insertionPoint
		? [
			...blocks.slice( 0, insertionPointIndex + 1 ),
			INSERTION_POINT_PLACEHOLDER,
			...blocks.slice( insertionPointIndex + 1 ),
		]
		: blocks;
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
			{ blocksWithInsertionPoint.map( ( uid ) => {
				if ( uid === INSERTION_POINT_PLACEHOLDER ) {
					return <div key={ INSERTION_POINT_PLACEHOLDER } className="editor-visual-editor__insertion-point" />;
				}
				return <VisualEditorBlock key={ uid } uid={ uid } />;
			} ) }
			<Inserter position="top right" />
		</div>
	);
	/* eslint-enable jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */
}

export default connect(
	( state ) => ( {
		blocks: getBlockUids( state ),
		insertionPoint: getBlockInsertionPoint( state ),
	} ),
	( dispatch ) => ( {
		clearSelectedBlock: () => dispatch( { type: 'CLEAR_SELECTED_BLOCK' } ),
	} ) )( VisualEditor );
