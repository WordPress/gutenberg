/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';
import {
	ImageNoAlignIcon,
	ImageAlignRightIcon,
	ImageAlignLeftIcon,
	ImageFullWidthIcon
} from 'dashicons';
import classNames from 'classnames';

import { EnhancedInputComponent } from 'wp-blocks';
import BlockArrangement from 'controls/block-arrangement';

export default class ImageBlockForm extends Component {

	merge() {
		this.props.remove();
	}

	bindCaption = ( ref ) => {
		this.caption = ref;
	}

	setImageAlignment = ( id ) => () => {
		this.props.change( { align: id } );
	};

	render() {
		const { block, change, moveDown, moveUp, remove, appendBlock, isFocused, focusConfig, focus } = this.props;
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
		const imageAlignments = [
			{ id: 'no-align', icon: ImageNoAlignIcon },
			{ id: 'align-left', icon: ImageAlignLeftIcon },
			{ id: 'align-right', icon: ImageAlignRightIcon },
			{ id: 'align-full-width', icon: ImageFullWidthIcon },
		];
		const alignValue = block.align || 'no-align';

		return (
			<div className={ classNames( 'image-caption-block', alignValue ) }>
				{ isFocused && <BlockArrangement block={ block } /> }
				{ isFocused &&
					<div className="block-list__block-controls">
						<div className="block-list__block-controls-group">
							{ imageAlignments.map( ( { id, icon: Icon } ) =>
								<button
									key={ id }
									onClick={ this.setImageAlignment( id ) }
									className={ classNames( 'block-list__block-control', {
										'is-selected': alignValue === id
									} ) }
								>
									<Icon />
								</button>
							) }
						</div>
					</div>
				}
				<img
					src={ block.src }
					className="image-caption-block__display"
					onClick={ () => {
						! isFocused && focus();
					} }
				/>
				<div className="image-caption-block__caption">
					<EnhancedInputComponent
						ref={ this.bindCaption }
						moveUp={ moveUp }
						removePrevious={ removePrevious }
						moveDown={ moveDown }
						splitValue={ splitValue }
						value={ block.caption }
						onChange={ ( value ) => change( { caption: value } ) }
						placeholder="Enter a caption"
						focusConfig={ focusConfig }
						onFocusChange={ focus }
					/>
				</div>
			</div>
		);
	}
}
