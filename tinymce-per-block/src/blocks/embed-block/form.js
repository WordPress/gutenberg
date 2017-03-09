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
	merge = () => {
		this.props.remove();
	};

	setAlignment = ( id ) => {
		this.props.change( { align: id } );
	};

	render() {
		const { block, isSelected, change, moveCursorUp, moveCursorDown, first, last,
			remove, focusConfig, focus, moveBlockUp, moveBlockDown, appendBlock, select, unselect } = this.props;

		const removePrevious = () => {
			if ( ! block.url ) {
				remove();
			}
		};
		const splitValue = ( left, right ) => {
			change( { caption: left } );
			appendBlock( {
				blockType: 'text',
				content: right
			} );
		};

		const html = getEmbedHtmlFromUrl( block.url );

		return (
			<div className={ classNames( 'embed-block', block.align ) }>
				{ isSelected && <BlockArrangement block={ block } first={ first } last={ last }
					moveBlockUp={ moveBlockUp } moveBlockDown={ moveBlockDown } /> }
				{ isSelected &&
					<div className="block-list__block-controls">
						<div className="block-list__block-controls-group">
							<FigureAlignmentToolbar value={ block.align } onChange={ this.setAlignment } />
						</div>
					</div>
				}

				<div onClick={ () => {
					select();
					! focusConfig && focus();
				} }>
					{ ! block.url &&
						<div className="embed-block__form">
							<div className="embed-block__title">
								<CloudOutline /> Embed URL
							</div>
							<EnhancedInputComponent
								ref={ this.bindInput }
								moveCursorUp={ moveCursorUp }
								removePrevious={ removePrevious }
								moveCursorDown={ moveCursorDown }
								value={ block.url }
								onChange={ ( value ) => change( { url: value } ) }
								focusConfig={ focusConfig }
								onFocusChange={ ( config ) => focus( config ) }
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
										moveCursorUp={ moveCursorUp }
										removePrevious={ removePrevious }
										moveCursorDown={ moveCursorDown }
										splitValue={ splitValue }
										value={ block.caption }
										onChange={ ( value ) => {
											change( { caption: value } );
											unselect();
										} }
										placeholder="Write caption"
										focusConfig={ focusConfig }
										onFocusChange={ focus }
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
