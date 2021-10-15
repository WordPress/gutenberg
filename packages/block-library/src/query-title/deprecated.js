/**
 * Internal dependencies
 */
import migrateFontFamily from '../utils/migrate-font-family';
import blockConfig from './block.json';

const {
	attributes: currentAttributes,
	supports: currentSupports,
} = blockConfig;

const v1 = {
	attributes: currentAttributes,
	supports: currentSupports,
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
 * They also need to contain the old deprecations.
 *
 * See block-deprecation.md
 */
export default [ v1 ];
