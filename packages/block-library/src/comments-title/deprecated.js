/**
 * Internal dependencies
 */
import migrateTextAlign from '../utils/migrate-text-align';

const v2 = {
	attributes: {
		textAlign: {
			type: 'string',
		},
		showPostTitle: {
			type: 'boolean',
			default: true,
		},
		showCommentsCount: {
			type: 'boolean',
			default: true,
		},
		level: {
			type: 'number',
			default: 2,
		},
		levelOptions: {
			type: 'array',
		},
	},
	supports: {
		anchor: true,
		align: true,
		html: false,
		__experimentalBorder: {
			radius: true,
			color: true,
			width: true,
			style: true,
		},
		color: {
			gradients: true,
			__experimentalDefaultControls: {
				background: true,
				text: true,
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
				__experimentalFontFamily: true,
				__experimentalFontStyle: true,
				__experimentalFontWeight: true,
			},
		},
		interactivity: {
			clientNavigation: true,
		},
	},
	migrate: ( oldAttributes ) => {
		const { singleCommentLabel, multipleCommentsLabel, ...newAttributes } =
			oldAttributes;
		return migrateTextAlign( newAttributes );
	},
	isEligible( attributes ) {
		return (
			!! attributes.textAlign ||
			!! attributes.className?.match(
				/\bhas-text-align-(left|center|right)\b/
			)
		);
	},
	save: () => null,
};

const v1 = {
	attributes: {
		textAlign: {
			type: 'string',
		},
		showPostTitle: {
			type: 'boolean',
			default: true,
		},
		showCommentsCount: {
			type: 'boolean',
			default: true,
		},
		level: {
			type: 'number',
			default: 2,
		},
		levelOptions: {
			type: 'array',
		},
		singleCommentLabel: {
			type: 'string',
		},
		multipleCommentsLabel: {
			type: 'string',
		},
	},
	supports: {
		anchor: true,
		align: true,
		html: false,
		__experimentalBorder: {
			radius: true,
			color: true,
			width: true,
			style: true,
		},
		color: {
			gradients: true,
			__experimentalDefaultControls: {
				background: true,
				text: true,
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
				__experimentalFontFamily: true,
				__experimentalFontStyle: true,
				__experimentalFontWeight: true,
			},
		},
		interactivity: {
			clientNavigation: true,
		},
	},
	migrate: ( oldAttributes ) => {
		const { singleCommentLabel, multipleCommentsLabel, ...newAttributes } =
			oldAttributes;
		return migrateTextAlign( newAttributes );
	},
	isEligible: ( { multipleCommentsLabel, singleCommentLabel } ) =>
		multipleCommentsLabel || singleCommentLabel,
	save: () => null,
};

export default [ v2, v1 ];
