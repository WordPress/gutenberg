/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';

import { serialize } from 'serializers/block';
import { EnhancedInputComponent } from 'wp-blocks';

export default class QuoteBlockForm extends Component {
	bindInput = ( ref ) => {
		this.input = ref;
	}

	focus = ( position ) => {
		this.input.focus( position );
	}

	merge = ( block, index ) => {
		const acceptedBlockTypes = [ 'quote', 'paragraph', 'heading' ];
		if ( acceptedBlockTypes.indexOf( block.blockType ) === -1 ) {
			return;
		}

		const { block: { children }, focus, remove, setChildren } = this.props;
		const value = serialize( children );
		setChildren( children.concat( block.children ) );
		remove( index );
		focus( value.length );
	}

	render() {
		const { block, setChildren, appendBlock, mergeWithPrevious, remove, moveUp, moveDown } = this.props;
		const { children } = block;
		const value = serialize( children );
		const onChangeContent = ( event ) => {
			setChildren( [ {
				type: 'Text',
				value: event.target.value || ' ' // grammar bug
			} ] );
		};
		const splitValue = ( left, right ) => {
			setChildren( [ {
				type: 'Text',
				value: left || ' ' // grammar bug
			} ] );
			if ( right ) {
				appendBlock( {
					...block,
					children: [
						{
							type: 'Text',
							value: right
						}
					]
				} );
			} else {
				appendBlock();
			}
		};
		const removePrevious = () => {
			if ( value && value !== ' ' ) {
				mergeWithPrevious();
			} else {
				remove();
			}
		};

		return (
			<div className="quote-block__form">
				<EnhancedInputComponent ref={ this.bindInput }
					value={ value }
					onChange={ onChangeContent }
					splitValue={ splitValue }
					removePrevious={ removePrevious }
					moveUp={ moveUp }
					moveDown={ moveDown }
				/>
			</div>
		);
	}
}
