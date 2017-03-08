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
		const { block, change, moveCursorDown, moveCursorUp, remove, appendBlock,
			isSelected, focusConfig, focus, moveBlockUp, moveBlockDown } = this.props;
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
				{ isSelected && <BlockArrangement block={ block }
					moveBlockUp={ moveBlockUp } moveBlockDown={ moveBlockDown } /> }
				{ isSelected &&
					<div className="block-list__block-controls">
						<div className="block-list__block-controls-group">
							<FigureAlignmentToolbar value={ block.align } onChange={ this.setAlignment } />
						</div>
					</div>
				}
				<img
					src={ block.src }
					className="image-block__display"
					onClick={ () => {
						! focusConfig && focus();
					} }
				/>
				<div className="image-block__caption">
					<EnhancedInputComponent
						moveCursorUp={ moveCursorUp }
						removePrevious={ removePrevious }
						moveCursorDown={ moveCursorDown }
						splitValue={ splitValue }
						value={ block.caption }
						onChange={ ( value ) => change( { caption: value } ) }
						placeholder="Write caption"
						focusConfig={ focusConfig }
						onFocusChange={ focus }
					/>
				</div>
			</div>
		);
	}
}
