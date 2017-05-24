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
import { getBlockUids, getBlockInsertionPoint, getBlockSelectionEnd } from '../../selectors';

const INSERTION_POINT_PLACEHOLDER = '[[insertion-point]]';

class VisualEditor extends wp.element.Component {
	constructor( props ) {
		super( props );

		this.onSelectionStart = this.onSelectionStart.bind( this );
		this.onSelectionChange = this.onSelectionChange.bind( this );
		this.onSelectionEnd = this.onSelectionEnd.bind( this );

		this.state = {
			selectionStart: null,
		};
	}

	onSelectionStart( uid ) {
		this.setState( { selectionStart: uid } );
	}

	onSelectionChange( uid ) {
		const { onMultiSelect, selectionEnd } = this.props;
		const { selectionStart } = this.state;

		if ( ! selectionStart || selectionStart === uid ) {
			return;
		}

		if ( selectionEnd === uid ) {
			return;
		}

		onMultiSelect( { start: selectionStart, end: uid } );
	}

	onSelectionEnd() {
		this.setState( { selectionStart: null } );
	}

	render() {
		const { blocks, insertionPoint } = this.props;
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
				className="editor-visual-editor"
				onMouseDown={ this.onPress }
				onTouchStart={ this.onPress }
				onMouseUp={ this.onRelease }
				onTouchEnd={ this.onRelease }
			>
				<PostTitle />
				{ blocksWithInsertionPoint.map( ( uid ) => {
					if ( uid === INSERTION_POINT_PLACEHOLDER ) {
						return <div key={ INSERTION_POINT_PLACEHOLDER } className="editor-visual-editor__insertion-point" />;
					}

					return (
						<VisualEditorBlock
							key={ uid }
							uid={ uid }
							selectionStart={ this.state.selectionStart }
							onSelectionStart={ () => this.onSelectionStart( uid ) }
							onSelectionChange={ () => this.onSelectionChange( uid ) }
							onSelectionEnd={ this.onSelectionEnd }
						/>
					);
				} ) }
				<Inserter position="top right" />
			</div>
		);
		/* eslint-enable jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */
	}
}

export default connect(
	( state ) => ( {
		blocks: getBlockUids( state ),
		insertionPoint: getBlockInsertionPoint( state ),
		selectionEnd: getBlockSelectionEnd( state ),
	} ),
	( dispatch ) => ( {
		clearSelectedBlock: () => dispatch( { type: 'CLEAR_SELECTED_BLOCK' } ),
		onMultiSelect( { start, end } ) {
			dispatch( { type: 'MULTI_SELECT', start, end } );
		},
	} ) )( VisualEditor );
