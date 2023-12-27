/**
 * External dependencies
 */
import createSelector from 'rememo';

/**
 * WordPress dependencies
 */
import { createRef } from '@wordpress/element';

export const getListViewToggleRef = createSelector(
	() => {
		return createRef();
	},
	() => []
);
