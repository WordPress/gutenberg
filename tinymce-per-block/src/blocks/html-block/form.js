/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';

import { EditableComponent } from 'wp-blocks';
import AlignmentToolbar from 'controls/alignment-toolbar';
import EditableFormatToolbar from 'controls/editable-format-toolbar';
import BlockArrangement from 'controls/block-arrangement';

export default class HtmlBlockForm extends Component {
	merge = ( block ) => {
		const acceptedBlockTypes = [ 'html', 'quote', 'text', 'heading' ];
		if ( acceptedBlockTypes.indexOf( block.blockType ) === -1 ) {
			return;
		}

		const { block: { content }, remove, change, focus } = this.props;
		focus( { end: true } );
		remove( block.uid );
		change( { content: content + block.content } );
		setTimeout( () => this.editable.updateContent() );
	}

	bindEditable = ( ref ) => {
		this.editable = ref;
	}

	setAlignment = ( align ) => {
		this.props.change( { align } );
	};

	bindFormatToolbar = ( ref ) => {
		this.toolbar = ref;
	};

	setToolbarState = ( ...args ) => {
		this.toolbar && this.toolbar.setToolbarState( ...args );
	};

	render() {
		const { block, isSelected, change, moveCursorUp, moveCursorDown, appendBlock,
			mergeWithPrevious, remove, focusConfig, focus, moveBlockUp, moveBlockDown } = this.props;
		const splitValue = ( left, right ) => {
			change( { content: left } );
			if ( right ) {
				appendBlock( {
					...block,
					content: right
				} );
			} else {
				appendBlock();
			}
		};
		const selectedTextAlign = block.align || 'left';
		const style = {
			textAlign: selectedTextAlign
		};

		return (
			<div>
				{ isSelected && <BlockArrangement block={ block }
					moveBlockUp={ moveBlockUp } moveBlockDown={ moveBlockDown } /> }
				{ isSelected && (
					<div className="block-list__block-controls">
						<div className="block-list__block-controls-group">
							<AlignmentToolbar value={ selectedTextAlign } onChange={ this.setAlignment } />
						</div>

						<div className="block-list__block-controls-group">
							<EditableFormatToolbar editable={ this.editable } ref={ this.bindFormatToolbar } />
						</div>
					</div>
				) }
				<div className="html-block__form" style={ style }>
					<EditableComponent
						ref={ this.bindEditable }
						content={ block.content }
						moveCursorUp={ moveCursorUp }
						moveCursorDown={ moveCursorDown }
						splitValue={ splitValue }
						mergeWithPrevious={ mergeWithPrevious }
						remove={ remove }
						setToolbarState={ this.setToolbarState }
						onChange={ ( value ) => change( { content: value } ) }
						focusConfig={ focusConfig }
						onFocusChange={ focus }
					/>
				</div>
			</div>
		);
	}
}
