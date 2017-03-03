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
		const { block, change, moveUp, moveDown, remove,
			mergeWithPrevious, appendBlock, isFocused, focusConfig, focus } = this.props;
		const splitValue = ( left, right ) => {
			change( { cite: left } );
			appendBlock( {
				blockType: 'paragraph',
				content: right
			} );
		};
		let focusInput = focusConfig && focusConfig.input;
		if ( ! focusInput && focusConfig ) {
			focusInput = focusConfig.end ? 'cite' : 'content';
		}

		return (
			<div>
				{ isFocused && <BlockArrangement block={ block } /> }
				{ isFocused &&
					<div className="block-list__block-controls">
						<div className="block-list__block-controls-group">
							<EditableFormatToolbar editable={ this.content } ref={ this.bindFormatToolbar } />
						</div>
					</div>
				}

				<div className="quote-block__form">
					<div className="quote-block__content">
						<EditableComponent
							ref={ this.bindContent }
							content={ block.content }
							moveUp={ moveUp }
							moveDown={ this.moveToCite }
							mergeWithPrevious={ mergeWithPrevious }
							remove={ remove }
							onChange={ ( value ) => change( { content: value } ) }
							setToolbarState={ this.setToolbarState }
							focusConfig={ focusInput === 'content' ? focusConfig : null }
							onFocusChange={ ( config ) => focus( Object.assign( { input: 'content' }, config ) ) }
							inline
						/>
					</div>
					<div className="quote-block__cite">
						<EnhancedInputComponent
							ref={ this.bindCite }
							moveUp={ this.moveToContent }
							removePrevious={ this.moveToContent }
							moveDown={ moveDown }
							value={ block.cite }
							splitValue={ splitValue }
							onChange={ ( value ) => change( { cite: value } ) }
							focusConfig={ focusInput === 'cite' ? focusConfig : null }
							onFocusChange={ ( config ) => focus( Object.assign( { input: 'cite' }, config ) ) }
							placeholder="Enter a cite"
						/>
					</div>
				</div>
			</div>
		);
	}
}
