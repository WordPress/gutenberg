/**
 * Internal dependencies
 */
import migrateFontFamily from '../utils/migrate-font-family';
import blockConfig from './block.json';

const {
	attributes: currentAttributes,
	supports: currentSupports,
} = blockConfig;

const deprecated = [
	{
		attributes: currentAttributes,
		supports: currentSupports,
		save() {
			return null;
		},
		migrate: migrateFontFamily,
		isEligible( { style } ) {
			return style?.typography?.fontFamily;
		},
	},
];

export default deprecated;
