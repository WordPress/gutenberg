/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';
import classNames from 'classnames';

import { EnhancedInputComponent } from 'wp-blocks';
import BlockArrangement from 'controls/block-arrangement';
import FigureAlignmentToolbar from 'controls/figure-alignment-toolbar';

export default class ImageBlockForm extends Component {

	merge() {
		this.props.remove();
	}

	setAlignment = ( id ) => {
		this.props.change( { align: id } );
	};

	render() {
		const { block, change, moveCursorDown, moveCursorUp, remove, appendBlock, first, last,
			isSelected, focusConfig, focus, moveBlockUp, moveBlockDown, select, unselect } = this.props;
		const removePrevious = () => {
			if ( ! block.caption ) {
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

		return (
			<div className={ classNames( 'image-block__form', block.align ) }>
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
					<img src={ block.src } className="image-block__display" />
					{ ( focusConfig || block.caption ) &&
						<div className="image-block__caption">
							<EnhancedInputComponent
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
			</div>
		);
	}
}
