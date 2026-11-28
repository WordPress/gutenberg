import type { CSSDirection } from '@wordpress/blocks';
import migrateTextAlign from '../utils/migrate-text-align';
import type { CommentContentAttributes } from './types';

const v1 = {
	attributes: {
		textAlign: {
			type: 'string',
		},
	},
	usesContext: [ 'commentId' ],
	supports: {
		anchor: true,
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
			__experimentalTextDecoration: true,
			__experimentalLetterSpacing: true,
		},
		__experimentalBorder: {
			radius: true,
			color: true,
			width: true,
			style: true,
		},
		spacing: {
			padding: [ 'horizontal', 'vertical' ] as CSSDirection[],
		},
		html: false,
	},
	save() {
		return null;
	},
	migrate: migrateTextAlign,
	isEligible( attributes: CommentContentAttributes ) {
		return (
			!! attributes.textAlign ||
			!! attributes.className?.match(
				/\bhas-text-align-(left|center|right)\b/
			)
		);
	},
};

export default [ v1 ];
