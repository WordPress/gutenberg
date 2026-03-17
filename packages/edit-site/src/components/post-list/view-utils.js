/**
 * Internal dependencies
 */
import { OPERATOR_IS_ANY } from '../../utils/constants';

export const defaultLayouts = {
	table: {
		layout: {
			styles: {
				author: {
					align: 'start',
				},
			},
		},
	},
	grid: {},
	list: {},
};

export const DEFAULT_VIEW = {
	type: 'list',
	filters: [],
	perPage: 20,
	sort: {
		field: 'title',
		direction: 'asc',
	},
	showLevels: true,
	titleField: 'title',
	mediaField: 'featured_media',
	fields: [ 'author', 'status' ],
	...defaultLayouts.list,
};

const SLUG_TO_STATUS = {
	published: 'publish',
	future: 'future',
	drafts: 'draft',
	pending: 'pending',
	private: 'private',
	trash: 'trash',
};

export function getActiveViewOverridesForTab( activeView, layouts ) {
	const base = {
		...layouts?.table,
	};
	const status = SLUG_TO_STATUS[ activeView ];
	if ( ! status ) {
		return base;
	}
	return {
		...base,
		filters: [
			{
				field: 'status',
				operator: OPERATOR_IS_ANY,
				value: status,
				isLocked: true,
			},
		],
	};
}
