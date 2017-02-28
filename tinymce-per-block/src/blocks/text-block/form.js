/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';
import { reduce } from 'lodash';
import { EditableComponent } from 'wp-blocks';

import { serialize } from 'serializers/block';

export default class TextBlockForm extends Component {
	focus( position ) {
		this.editable.focus( position );
	}

	merge = ( block, index ) => {
		const acceptedBlockTypes = [ 'text', 'quote', 'paragraph', 'heading' ];
		if ( acceptedBlockTypes.indexOf( block.blockType ) === -1 ) {
			return;
		}

		const { block: { children }, remove, setChildren } = this.props;
		setChildren( children.concat( block.children ) );
		remove( index );
		setTimeout( () => this.editable.appendContent( serialize( block.children ) ) );
	}

	bindEditable = ( ref ) => {
		this.editable = ref;
	}

	render() {
		const { block, setChildren, moveUp, moveDown, appendBlock, mergeWithPrevious, remove } = this.props;
		const { children } = block;
		const style = reduce( block.attrs, ( memo, value, key ) => {
			switch ( key ) {
				case 'align':
					memo.textAlign = value;
					break;
			}

			return memo;
		}, {} );

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
			<div className="text-block__form" style={ style }>
				<EditableComponent
					ref={ this.bindEditable }
					initialContent={ serialize( children ) }
					moveUp={ moveUp }
					moveDown={ moveDown }
					splitValue={ splitValue }
					mergeWithPrevious={ mergeWithPrevious }
					remove={ remove }
					onChange={ ( value ) => setChildren( value ) } />
			</div>
		);
	}
}
