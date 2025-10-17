/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * Internal dependencies
 */
import migrateFontFamily from '../utils/migrate-font-family';

const v2 = {
	attributes: {
		textAlign: {
			type: 'string',
		},
		format: {
			type: 'string',
		},
		isLink: {
			type: 'boolean',
			default: false,
			role: 'content',
		},
		displayType: {
			type: 'string',
			default: 'date',
		},
	},
	supports: {
		html: false,
		color: {
			gradients: true,
			link: true,
			__experimentalDefaultControls: {
				background: true,
				text: true,
				link: true,
			},
		},
		spacing: {
			margin: true,
			padding: true,
		},
		typography: {
			fontSize: true,
			lineHeight: true,
			__experimentalFontFamily: true,
			__experimentalFontWeight: true,
			__experimentalFontStyle: true,
			__experimentalTextTransform: true,
			__experimentalTextDecoration: true,
			__experimentalLetterSpacing: true,
			__experimentalDefaultControls: {
				fontSize: true,
			},
		},
		interactivity: {
			clientNavigation: true,
		},
		__experimentalBorder: {
			radius: true,
			color: true,
			width: true,
			style: true,
			__experimentalDefaultControls: {
				radius: true,
				color: true,
				width: true,
				style: true,
			},
		},
	},
	save() {
		return null;
	},
	migrate( { className, displayType, metadata, ...otherAttributes } ) {
		if ( displayType === 'date' || displayType === 'modified' ) {
			if ( displayType === 'modified' ) {
				className = clsx(
					className,
					'wp-block-post-date__modified-date'
				);
			}

			return {
				...otherAttributes,
				className,
				metadata: {
					...metadata,
					bindings: {
						datetime: {
							source: 'core/post-data',
							args: { field: displayType },
						},
					},
				},
			};
		}
	},
	isEligible( attributes ) {
		// If there's neither an explicit `datetime` attribute nor a block binding for that attribute,
		// then we're dealing with an old version of the block.
		return (
			! attributes.datetime && ! attributes?.metadata?.bindings?.datetime
		);
	},
};

const v1 = {
	attributes: {
		textAlign: {
			type: 'string',
		},
		format: {
			type: 'string',
		},
		isLink: {
			type: 'boolean',
			default: false,
		},
	},
	supports: {
		html: false,
		color: {
			gradients: true,
			link: true,
		},
		typography: {
			fontSize: true,
			lineHeight: true,
			__experimentalFontFamily: true,
			__experimentalFontWeight: true,
			__experimentalFontStyle: true,
			__experimentalTextTransform: true,
			__experimentalLetterSpacing: true,
		},
	},
	save() {
		return null;
	},
	migrate: migrateFontFamily,
	isEligible( { style } ) {
		return style?.typography?.fontFamily;
	},
};

/**
 * New deprecations need to be placed first
 * for them to have higher priority.
 *
 * Old deprecations may need to be updated as well.
 *
 * See block-deprecation.md
 */
export default [ v2, v1 ];
