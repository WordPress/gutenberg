/**
 * External dependencies
 */
import { omit } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { RichText } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	backgroundImageStyles,
	dimRatioToClass,
	blockAttributes,
} from './shared';

export default {
	attributes: {
		...blockAttributes,
		title: {
			type: 'string',
			source: 'html',
			selector: 'h2',
		},
		align: {
			type: 'string',
		},
		contentAlign: {
			type: 'string',
			default: 'center',
		},
	},
	supports: {
		className: false,
	},
	save( { attributes } ) {
		const { url, title, hasParallax, dimRatio, align } = attributes;
		const style = backgroundImageStyles( url );
		const classes = classnames(
			'wp-block-cover-image',
			dimRatioToClass( dimRatio ),
			{
				'has-background-dim': dimRatio !== 0,
				'has-parallax': hasParallax,
			},
			align ? `align${ align }` : null
		);

		return (
			<section className={ classes } style={ style }>
				<RichText.Content tagName="h2" value={ title } />
			</section>
		);
	},
	migrate( attributes ) {
		return [
			omit( attributes, [ 'title', 'contentAlign', 'align' ] ),
			[
				createBlock( 'core/paragraph', {
					content: attributes.title,
					align: attributes.contentAlign,
					fontSize: 'large',
					placeholder: __( 'Write title…' ),
				} ),
			],
		];
	},
};
