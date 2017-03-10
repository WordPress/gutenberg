/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';
import classNames from 'classnames';

import { EnhancedInputComponent } from 'wp-blocks';
import BlockArrangement from 'controls/block-arrangement';
import FigureAlignmentToolbar from 'controls/figure-alignment-toolbar';

export default class ImageBlockForm extends Component {
	setAlignment = ( id ) => {
		this.props.api.change( { align: id } );
	};

	render() {
		const { api, block, first, last, isSelected, focusConfig } = this.props;
		const removePrevious = () => {
			if ( ! block.caption ) {
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

		return (
			<div className={ classNames( 'image-block__form', block.align ) }>
				{ isSelected && <BlockArrangement first={ first } last={ last }
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
					<img src={ block.src } className="image-block__display" />
					{ ( focusConfig || block.caption ) &&
						<div className="image-block__caption">
							<EnhancedInputComponent
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
			</div>
		);
	}
}
