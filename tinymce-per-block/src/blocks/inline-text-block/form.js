/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';
import { EditableComponent } from 'wp-blocks';

import { serialize } from 'serializers/block';

export default class InlineTextBlockForm extends Component {
	focus( position ) {
		this.editable.focus( position );
	}

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

		const { block: { children }, remove, setChildren } = this.props;
		remove( index );
		setTimeout( () => setChildren( getLeaves( children ).concat( getLeaves( block.children ) ) ) );
	}

	bindEditable = ( ref ) => {
		this.editable = ref;
	}

	render() {
		const { block, setChildren, moveUp, moveDown, appendBlock, mergeWithPrevious, remove } = this.props;
		const { children } = block;

		const splitValue = ( left, right ) => {
			setChildren( left );
			if ( right ) {
				appendBlock( {
					...block,
					children: right
				} );
			} else {
				appendBlock();
			}
		};

		return (
			<EditableComponent
				ref={ this.bindEditable }
				content={ serialize( children ) }
				moveUp={ moveUp }
				moveDown={ moveDown }
				splitValue={ splitValue }
				mergeWithPrevious={ mergeWithPrevious }
				remove={ remove }
				onChange={ ( value ) => setChildren( value ) }
				inline
				single
			/>
		);
	}
}
