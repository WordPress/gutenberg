/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';

import { EditableComponent, EnhancedInputComponent } from 'wp-blocks';
import { serialize } from 'serializers/block';
import { parse } from 'parsers/block';
import EditableFormatToolbar from 'controls/editable-format-toolbar';
import BlockArrangement from 'controls/block-arrangement';

export default class QuoteBlockForm extends Component {
	bindContent = ( ref ) => {
		this.content = ref;
	};

	bindCite = ( ref ) => {
		this.cite = ref;
	};

	merge = ( block ) => {
		const acceptedBlockTypes = [ 'quote', 'text', 'heading' ];
		if ( acceptedBlockTypes.indexOf( block.blockType ) === -1 ) {
			return;
		}

		const getLeaves = html => {
			const div = document.createElement( 'div' );
			div.innerHTML = html;
			if ( div.childNodes.length === 1 && div.firstChild.nodeName === 'P' ) {
				return getLeaves( div.firstChild.innerHTML );
			}
			return html;
		};

		const { block: { content }, remove, change } = this.props;
		remove( block.uid );
		setTimeout( () => change(
			{ content: getLeaves( content ) + getLeaves( block.content ) }
		) );
		setTimeout( () => this.content.updateContent() );
	}

	moveToCite = () => {
		this.props.focus( { input: 'cite', start: true } );
	};

	moveToContent = () => {
		this.props.focus( { input: 'content', end: true } );
	};

	bindFormatToolbar = ( ref ) => {
		this.toolbar = ref;
	};

	setToolbarState = ( ...args ) => {
		this.toolbar && this.toolbar.setToolbarState( ...args );
	};

	render() {
		const { block, change, moveCursorUp, moveCursorDown, remove,
			mergeWithPrevious, appendBlock, isSelected, focusConfig, focus,
			moveBlockUp, moveBlockDown } = this.props;
		const splitValue = ( left, right ) => {
			change( { cite: left } );
			appendBlock( {
				blockType: 'text',
				content: right
			} );
		};
		let focusInput = focusConfig && focusConfig.input;
		if ( ! focusInput && focusConfig ) {
			focusInput = focusConfig.end ? 'cite' : 'content';
		}

		return (
			<div>
				{ isSelected && <BlockArrangement block={ block }
					moveBlockUp={ moveBlockUp } moveBlockDown={ moveBlockDown } /> }
				{ isSelected &&
					<div className="block-list__block-controls">
						<div className="block-list__block-controls-group">
							<EditableFormatToolbar editable={ focusInput === 'content' ? this.content : this.cite } ref={ this.bindFormatToolbar } />
						</div>
					</div>
				}

				<div className="quote-block__form">
					<div className="quote-block__content">
						<EditableComponent
							ref={ this.bindContent }
							content={ block.content }
							moveCursorUp={ moveCursorUp }
							moveCursorDown={ this.moveToCite }
							mergeWithPrevious={ mergeWithPrevious }
							remove={ remove }
							onChange={ ( value ) => change( { content: value } ) }
							setToolbarState={ focusInput === 'content' ? this.setToolbarState : undefined }
							focusConfig={ focusInput === 'content' ? focusConfig : null }
							onFocusChange={ ( config ) => focus( Object.assign( { input: 'content' }, config ) ) }
							inline
						/>
					</div>
					<div className="quote-block__cite">
						<EditableComponent
							ref={ this.bindCite }
							moveCursorUp={ this.moveToContent }
							moveCursorDown={ moveCursorDown }
							mergeWithPrevious={ this.moveToContent }
							remove={ this.moveToContent }
							content={ block.cite }
							splitValue={ splitValue }
							onChange={ ( value ) => change( { cite: value } ) }
							setToolbarState={ focusInput === 'cite' ? this.setToolbarState : undefined }
							focusConfig={ focusInput === 'cite' ? focusConfig : null }
							onFocusChange={ ( config ) => focus( Object.assign( { input: 'cite' }, config ) ) }
							inline
							single
						/>
					</div>
				</div>
			</div>
		);
	}
}
