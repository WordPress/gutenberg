/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';
import classNames from 'classnames';
import { EditorQuoteIcon } from 'dashicons';

/**
 * Internal dependencies
 */
import { EditableComponent } from 'wp-blocks';
import EditableFormatToolbar from 'controls/editable-format-toolbar';
import BlockArrangement from 'controls/block-arrangement';
import TransformBlockToolbar from 'controls/transform-block-toolbar';

export default class QuoteBlockForm extends Component {
	bindContent = ( ref ) => {
		this.content = ref;
	};

	bindCite = ( ref ) => {
		this.cite = ref;
	};

	moveToCite = () => {
		this.props.api.focus( { input: 'cite', start: true } );
	};

	moveToContent = () => {
		this.props.api.focus( { input: 'content', end: true } );
	};

	bindFormatToolbar = ( ref ) => {
		this.toolbar = ref;
	};

	setToolbarState = ( ...args ) => {
		this.toolbar && this.toolbar.setToolbarState( ...args );
	};

	setStyle = ( style ) => () => {
		this.props.api.change( { style } );
	};

	render() {
		const { api, block, first, last, isSelected, focusConfig } = this.props;
		const splitValue = ( left, right ) => {
			api.change( {
				cite: left,
				citeExternalChange: ( block.citeExternalChange || 0 ) + 1
			} );
			api.appendBlock( {
				blockType: 'text',
				content: right
			} );
		};
		let focusInput = focusConfig && focusConfig.input;
		if ( ! focusInput && focusConfig ) {
			focusInput = focusConfig.end ? 'cite' : 'content';
		}
		const styles = [ 'style1', 'style2' ];
		const currentStyle = block.style || 'style1';

		return (
			<div>
				{ isSelected && <BlockArrangement first={ first } last={ last }
					moveBlockUp={ api.moveBlockUp } moveBlockDown={ api.moveBlockDown } /> }
				{ isSelected &&
					<div className="block-list__block-controls">
						<div className="block-list__block-controls-group">
							<TransformBlockToolbar blockType="quote" onTransform={ api.transform } />
						</div>

						<div className="block-list__block-controls-group">
							{ styles.map( ( style, index ) =>
								<button
									key={ style }
									onClick={ this.setStyle( style ) }
									className={ classNames(
										'block-list__block-control',
										'quote-block__toolbar-style-button',
										{ 'is-selected': currentStyle === style }
									) }
								>
									<EditorQuoteIcon />
									<span className="quote-block__toolbar-style">{ index }</span>
								</button>
							) }
						</div>

						<div className="block-list__block-controls-group">
							<EditableFormatToolbar editable={ focusInput === 'content' ? this.content : this.cite }
								ref={ this.bindFormatToolbar } />
						</div>
					</div>
				}

				<div className={ 'quote-block__form quote-' + currentStyle } onClick={ api.select }>
					<div className="quote-block__content">
						<EditableComponent
							ref={ this.bindContent }
							content={ block.content }
							externalChange={ block.externalChange }
							moveCursorUp={ api.moveCursorUp }
							moveCursorDown={ this.moveToCite }
							mergeWithPrevious={ api.mergeWithPrevious }
							remove={ api.remove }
							onChange={ ( value ) => api.change( { content: value } ) }
							setToolbarState={ focusInput === 'content' ? this.setToolbarState : undefined }
							focusConfig={ focusInput === 'content' ? focusConfig : null }
							onFocusChange={ ( config ) => api.focus( Object.assign( { input: 'content' }, config ) ) }
							onType={ api.unselect }
							inline
						/>
					</div>
					{ ( focusConfig || block.cite ) &&
						<div className="quote-block__cite">
							<EditableComponent
								ref={ this.bindCite }
								moveCursorUp={ this.moveToContent }
								moveCursorDown={ api.moveCursorDown }
								mergeWithPrevious={ this.moveToContent }
								remove={ this.moveToContent }
								content={ block.cite }
								externalChange={ block.citeExternalChange }
								splitValue={ splitValue }
								onChange={ ( value ) => api.change( { cite: value } ) }
								setToolbarState={ focusInput === 'cite' ? this.setToolbarState : undefined }
								focusConfig={ focusInput === 'cite' ? focusConfig : null }
								onFocusChange={ ( config ) => api.focus( Object.assign( { input: 'cite' }, config ) ) }
								onType={ api.unselect }
								inline
								single
							/>
						</div>
					}
				</div>
			</div>
		);
	}
}
