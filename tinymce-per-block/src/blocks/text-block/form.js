/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';

import { EditableComponent } from 'wp-blocks';
import { serialize } from 'serializers/block';
import AlignmentToolbar from 'controls/alignment-toolbar';
import EditableFormatToolbar from 'controls/editable-format-toolbar';

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
		remove( index );
		setTimeout( () => setChildren( children.concat( block.children ) ) );
	}

	bindEditable = ( ref ) => {
		this.editable = ref;
	}

	setAlignment = ( textAlign ) => {
		this.props.setAttributes( { textAlign } );
	};

	bindFormatToolbar = ( ref ) => {
		this.toolbar = ref;
	};

	setToolbarState = ( ...args ) => {
		this.toolbar && this.toolbar.setToolbarState( ...args );
	};

	render() {
		const { block, isFocused, setChildren, moveUp, moveDown, appendBlock, mergeWithPrevious, remove } = this.props;
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
		const selectedTextAlign = block.attrs.textAlign || 'left';
		const style = {
			textAlign: selectedTextAlign
		};

		return (
			<div>
				{ isFocused && (
					<div className="block-list__block-controls">
						<div className="block-list__block-controls-group">
							<AlignmentToolbar value={ block.attrs.textAlign } onChange={ this.setAlignment } />
						</div>

						<div className="block-list__block-controls-group">
							<EditableFormatToolbar editable={ this.editable } ref={ this.bindFormatToolbar } />
						</div>
					</div>
				) }
				<div className="text-block__form" style={ style }>
					<EditableComponent
						ref={ this.bindEditable }
						content={ serialize( children ) }
						moveUp={ moveUp }
						moveDown={ moveDown }
						splitValue={ splitValue }
						mergeWithPrevious={ mergeWithPrevious }
						remove={ remove }
						setToolbarState={ this.setToolbarState }
						onChange={ ( value ) => setChildren( value ) } />
				</div>
			</div>
		);
	}
}
