/**
 * WordPress dependencies
 */
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';

const { cleanEmptyObject } = unlock( blockEditorPrivateApis );

const v1 = {
	attributes: {
		isLink: {
			type: 'boolean',
			default: false,
		},
		aspectRatio: {
			type: 'string',
		},
		width: {
			type: 'string',
		},
		height: {
			type: 'string',
		},
		scale: {
			type: 'string',
			default: 'cover',
		},
		sizeSlug: {
			type: 'string',
		},
		rel: {
			type: 'string',
			attribute: 'rel',
			default: '',
		},
		linkTarget: {
			type: 'string',
			default: '_self',
		},
		overlayColor: {
			type: 'string',
		},
		customOverlayColor: {
			type: 'string',
		},
		dimRatio: {
			type: 'number',
			default: 0,
		},
		gradient: {
			type: 'string',
		},
		customGradient: {
			type: 'string',
		},
	},
	supports: {
		align: [ 'left', 'right', 'center', 'wide', 'full' ],
		color: {
			__experimentalDuotone:
				'img, .wp-block-post-featured-image__placeholder, .components-placeholder__illustration, .components-placeholder::before',
			text: false,
			background: false,
		},
		__experimentalBorder: {
			color: true,
			radius: true,
			width: true,
			__experimentalSelector:
				'img, .block-editor-media-placeholder, .wp-block-post-featured-image__overlay',
			__experimentalSkipSerialization: true,
			__experimentalDefaultControls: {
				color: true,
				radius: true,
				width: true,
			},
		},
		html: false,
		spacing: {
			padding: true,
			margin: true,
		},
	},
	save() {
		return null;
	},
	migrate: ( oldAttributes ) => {
		if ( ! oldAttributes?.style?.spacing?.padding ) {
			return oldAttributes;
		}
		return {
			...oldAttributes,
			style: cleanEmptyObject( {
				...oldAttributes.style,
				spacing: {
					...oldAttributes.style.spacing,
					padding: undefined,
				},
			} ),
		};
	},
	isEligible( { style } ) {
		return style?.spacing?.padding;
	},
};

export default [ v1 ];
