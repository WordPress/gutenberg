/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';
import { EditableComponent } from 'wp-blocks';

import { parse } from 'parsers/block';
import { serialize } from 'serializers/block';

export default class InlineTextBlockForm extends Component {
	merge = ( block, index ) => {
		const acceptedBlockTypes = [ 'quote', 'paragraph', 'heading' ];
		if ( acceptedBlockTypes.indexOf( block.blockType ) === -1 ) {
			return;
		}

		const getLeaves = children => {
			if ( children.length === 1 && children[ 0 ].name === 'p' ) {
				return getLeaves( children[ 0 ].children );
			}

			return children;
		};

		const { block: { content }, remove, change } = this.props;
		remove( index );
		setTimeout( () => change(
			{ content: serialize( getLeaves( parse( content ) ).concat( getLeaves( parse( block.content ) ) ) ) }
		) );
		setTimeout( () => this.editable.updateContent() );
	}

	bindEditable = ( ref ) => {
		this.editable = ref;
	}

	executeCommand = ( ...args ) => {
		this.editable.executeCommand( ...args );
	};

	render() {
		const { block, change, moveUp, moveDown, appendBlock,
			mergeWithPrevious, remove, setToolbarState, focus, focusConfig } = this.props;

		const splitValue = ( left, right ) => {
			change( { content: left } );
			setTimeout( () => this.editable.updateContent() );
			if ( right ) {
				appendBlock( {
					...block,
					content: right
				} );
			} else {
				appendBlock();
			}
		};

		return (
			<EditableComponent
				ref={ this.bindEditable }
				content={ block.content }
				moveUp={ moveUp }
				moveDown={ moveDown }
				splitValue={ splitValue }
				mergeWithPrevious={ mergeWithPrevious }
				remove={ remove }
				onChange={ ( value ) => change( { content: value } ) }
				setToolbarState={ setToolbarState }
				focusConfig={ focusConfig }
				onFocusChange={ focus }
				inline
				single
			/>
		);
	}
}
