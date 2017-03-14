/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';
import { CloudOutline } from 'dashicons';
import classNames from 'classnames';

/**
 * Internal Dependencies
 */
import { EnhancedInputComponent } from 'wp-blocks';
import BlockArrangement from 'controls/block-arrangement';
import { getEmbedHtmlFromUrl } from '../../utils/embed';
import FigureAlignmentToolbar from 'controls/figure-alignment-toolbar';

export default class EmbedBlockForm extends Component {
	setAlignment = ( id ) => {
		this.props.api.change( { align: id } );
	};

	render() {
		const { api, block, isSelected, isHovered, first, last, focusConfig } = this.props;

		const removePrevious = () => {
			if ( ! block.url ) {
				api.remove();
			}
		};
		const splitValue = ( left, right ) => {
			api.change( { caption: left } );
			api.appendBlock( {
				blockType: 'text',
				content: right
			} );
		};

		const html = getEmbedHtmlFromUrl( block.url, block.align );

		return (
			<div className={ classNames( 'embed-block', block.align ) }
				onMouseEnter={ api.hover } onMouseLeave={ api.unhover }
			>
				{ ( isSelected || isHovered ) && <BlockArrangement first={ first } last={ last }
					moveBlockUp={ api.moveBlockUp } moveBlockDown={ api.moveBlockDown } /> }
				{ isSelected &&
					<div className="block-list__block-controls">
						<div className="block-list__block-controls-group">
							<FigureAlignmentToolbar value={ block.align } onChange={ this.setAlignment } />
						</div>
					</div>
				}

				<div onClick={ () => {
					api.select();
					! focusConfig && api.focus();
				} }>
					{ ! block.url &&
						<div className="embed-block__form">
							<div className="embed-block__title">
								<CloudOutline /> Embed URL
							</div>
							<EnhancedInputComponent
								ref={ this.bindInput }
								moveCursorUp={ api.moveCursorUp }
								removePrevious={ removePrevious }
								moveCursorDown={ api.moveCursorDown }
								value={ block.url }
								onChange={ ( value ) => api.change( { url: value } ) }
								focusConfig={ focusConfig }
								onFocusChange={ api.focus }
								placeholder="Paste URL to embed here..."
							/>
						</div>
					}
					{ block.url &&
						<div className="embed-block__content">
							<div dangerouslySetInnerHTML={ { __html: html } } />
							{ ( focusConfig || block.caption ) &&
								<div className="embed-block__caption">
									<EnhancedInputComponent
										ref={ this.bindCaption }
										moveCursorUp={ api.moveCursorUp }
										removePrevious={ removePrevious }
										moveCursorDown={ api.moveCursorDown }
										splitValue={ splitValue }
										value={ block.caption }
										onChange={ ( value ) => {
											api.change( { caption: value } );
											api.unselect();
										} }
										placeholder="Write caption"
										focusConfig={ focusConfig }
										onFocusChange={ api.focus }
									/>
								</div>
							}
						</div>
					}
				</div>
			</div>
		);
	}
}
