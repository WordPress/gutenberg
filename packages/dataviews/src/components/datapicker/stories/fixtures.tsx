/**
 * Internal dependencies
 */
import type { View } from '../../../types';

export const DEFAULT_VIEW: View = {
	type: 'picker-grid',
	search: '',
	page: 1,
	perPage: 10,
	filters: [],
	fields: [ 'categories' ],
	titleField: 'title',
	descriptionField: 'description',
	mediaField: 'image',
};
