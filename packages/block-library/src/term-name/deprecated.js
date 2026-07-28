/**
 * Internal dependencies
 */
import migrateTextAlign from '../utils/migrate-text-align';

const v1 = {
	attributes: {
		textAlign: {
			type: 'string',
		},
		level: {
			type: 'number',
			default: 0,
		},
		isLink: {
			type: 'boolean',
			default: false,
		},
		levelOptions: {
			type: 'array',
		},
	},
	supports: {
		anchor: true,
		align: [ 'wide', 'full' ],
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
				color: true,
				width: true,
				style: true,
			},
		},
	},
	migrate: migrateTextAlign,
	isEligible( attributes ) {
		return !! attributes.textAlign;
	},
	save: () => null,
};

export default [ v1 ];
