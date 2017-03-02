/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';
import { find } from 'lodash';
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

	focus( position ) {
		this.caption.focus( position );
	}

	bindCaption = ( ref ) => {
		this.caption = ref;
	}

	setImageAlignment = ( id ) => () => {
		this.props.setAttributes( { align: id } );
	};

	render() {
		const { block, setAttributes, moveDown, moveUp, remove, appendBlock, isFocused } = this.props;
		const { attrs, children } = block;
		const image = find( children, ( { name } ) => 'img' === name );
		if ( ! image ) {
			return null;
		}
		const caption = attrs.caption || '';
		const removePrevious = () => {
			if ( ! caption ) {
				remove();
			}
		};
		const splitValue = ( left, right ) => {
			setAttributes( { caption: left } );
			appendBlock( {
				type: 'WP_Block',
				blockType: 'paragraph',
				attrs: {},
				startText: '<!-- wp:paragraph -->',
				endText: '<!-- /wp -->',
				rawContent: '<!-- wp:paragraph -->' + right + '<!-- /wp -->',
				children: [ {
					type: 'Text',
					value: right
				} ]
			} );
		};
		const imageAlignments = [
			{ id: 'no-align', icon: ImageNoAlignIcon },
			{ id: 'align-left', icon: ImageAlignLeftIcon },
			{ id: 'align-right', icon: ImageAlignRightIcon },
			{ id: 'align-full-width', icon: ImageFullWidthIcon },
		];
		const alignValue = attrs.align || 'no-align';

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
					src={ image.attrs.src }
					className="image-caption-block__display"
				/>
				<div className="image-caption-block__caption">
					<EnhancedInputComponent
						ref={ this.bindCaption }
						moveUp={ moveUp }
						removePrevious={ removePrevious }
						moveDown={ moveDown }
						splitValue={ splitValue }
						value={ caption }
						onChange={ ( value ) => setAttributes( { caption: value } ) }
						placeholder="Enter a caption"
					/>
				</div>
			</div>
		);
	}
}
