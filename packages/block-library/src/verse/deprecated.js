/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import migrateFontFamily from '../utils/migrate-font-family';
import blockConfig from './block.json';
import currentSave from './save';

const {
	attributes: currentAttributes,
	supports: currentSupports,
} = blockConfig;

const v1 = {
	attributes: {
		content: {
			type: 'string',
			source: 'html',
			selector: 'pre',
			default: '',
		},
		textAlign: {
			type: 'string',
		},
	},
	save( { attributes } ) {
		const { textAlign, content } = attributes;

		return (
			<RichText.Content
				tagName="pre"
				style={ { textAlign } }
				value={ content }
			/>
		);
	},
};

const v2 = {
	attributes: currentAttributes,
	supports: currentSupports,
	save: currentSave,
	migrate: migrateFontFamily,
	isEligible( { style } ) {
		return style?.typography?.fontFamily;
	},
};

/**
 * New deprecations need to be placed first
 * for them to have higher priority.
 * They also need to contain the old deprecations.
 *
 * See block-deprecation.md
 */
export default [ v2, v1 ];
