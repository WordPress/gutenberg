/**
 * WordPress dependencies
 */
import { keycodes } from '@wordpress/utils';

const { getAccessCombination } = keycodes;

const combination = getAccessCombination( 'm' );

export default {
	toggleEditorMode: {
		value: combination.toLowerCase(),
		label: combination,
	},
};
