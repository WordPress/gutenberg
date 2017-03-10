/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';

import { EditableComponent } from 'wp-blocks';
import AlignmentToolbar from 'controls/alignment-toolbar';
import EditableFormatToolbar from 'controls/editable-format-toolbar';
import BlockArrangement from 'controls/block-arrangement';

export default class HtmlBlockForm extends Component {
	bindEditable = ( ref ) => {
		this.editable = ref;
	}

	setAlignment = ( align ) => {
		this.props.api.change( { align } );
	};

	bindFormatToolbar = ( ref ) => {
		this.toolbar = ref;
	};

	setToolbarState = ( ...args ) => {
		this.toolbar && this.toolbar.setToolbarState( ...args );
	};

	render() {
		const { api, block, isSelected, first, last, focusConfig } = this.props;
		const splitValue = ( left, right ) => {
			api.change( {
				content: left,
				externalChange: ( block.externalChange || 0 ) + 1
			} );
			if ( right ) {
				api.appendBlock( {
					...block,
					content: right
				} );
			} else {
				api.appendBlock();
			}
		};
		const selectedTextAlign = block.align || 'left';
		const style = {
			textAlign: selectedTextAlign
		};

		return (
			<div>
				{ isSelected && <BlockArrangement first={ first } last={ last }
					moveBlockUp={ api.moveBlockUp } moveBlockDown={ api.moveBlockDown } /> }
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
				<div className="html-block__form" style={ style } onClick={ api.select }>
					<EditableComponent
						ref={ this.bindEditable }
						content={ block.content }
						externalChange={ block.externalChange }
						moveCursorUp={ api.moveCursorUp }
						moveCursorDown={ api.moveCursorDown }
						splitValue={ splitValue }
						mergeWithPrevious={ api.mergeWithPrevious }
						remove={ api.remove }
						setToolbarState={ this.setToolbarState }
						onChange={ ( value ) => api.change( { content: value } ) }
						focusConfig={ focusConfig }
						onFocusChange={ api.focus }
						onType={ api.unselect }
					/>
				</div>
			</div>
		);
	}
}
