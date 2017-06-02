/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import VisualEditorBlock from './block';
import {
	getBlockUids,
	getBlockInsertionPoint,
	getBlockSelectionStart,
	getBlockSelectionEnd,
} from '../../selectors';

const INSERTION_POINT_PLACEHOLDER = '[[insertion-point]]';

class VisualEditorBlockList extends wp.element.Component {
	constructor( props ) {
		super( props );

		this.onSelectionStart = this.onSelectionStart.bind( this );
		this.onSelectionChange = this.onSelectionChange.bind( this );
		this.onSelectionEnd = this.onSelectionEnd.bind( this );

		this.state = {
			selectionAtStart: null,
		};
	}

	onSelectionStart( uid ) {
		this.setState( { selectionAtStart: uid } );
	}

	onSelectionChange( uid ) {
		const { onMultiSelect, selectionStart, selectionEnd } = this.props;
		const { selectionAtStart } = this.state;
		const isAtStart = selectionAtStart === uid;

		if ( ! selectionAtStart ) {
			return;
		}

		if ( isAtStart && selectionStart ) {
			onMultiSelect( { start: null, end: null } );
		}

		if ( ! isAtStart && selectionEnd !== uid ) {
			onMultiSelect( { start: selectionAtStart, end: uid } );
		}
	}

	onSelectionEnd() {
		this.setState( { selectionAtStart: null } );
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

		return (
			<div>
				{ blocksWithInsertionPoint.map( ( uid ) => {
					if ( uid === INSERTION_POINT_PLACEHOLDER ) {
						return (
							<div
								key={ INSERTION_POINT_PLACEHOLDER }
								className="editor-visual-editor__insertion-point"
							/>
						);
					}

					return (
						<VisualEditorBlock
							key={ uid }
							uid={ uid }
							onSelectionStart={ () => this.onSelectionStart( uid ) }
							onSelectionChange={ () => this.onSelectionChange( uid ) }
							onSelectionEnd={ this.onSelectionEnd }
						/>
					);
				} ) }
			</div>
		);
	}
}

export default connect(
	( state ) => ( {
		blocks: getBlockUids( state ),
		insertionPoint: getBlockInsertionPoint( state ),
		selectionStart: getBlockSelectionStart( state ),
		selectionEnd: getBlockSelectionEnd( state ),
	} ),
	( dispatch ) => ( {
		onMultiSelect( { start, end } ) {
			dispatch( { type: 'MULTI_SELECT', start, end } );
		},
	} )
)( VisualEditorBlockList );
