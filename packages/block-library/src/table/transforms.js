/**
 * WordPress dependencies
 */
import { getPhrasingContentSchema } from '@wordpress/blocks';

const tableContentPasteSchema = {
	tr: {
		allowEmpty: true,
		children: {
			th: {
				allowEmpty: true,
				children: getPhrasingContentSchema(),
				attributes: [ 'scope' ],
			},
			td: {
				allowEmpty: true,
				children: getPhrasingContentSchema(),
			},
		},
	},
};

const tablePasteSchema = {
	table: {
		children: {
			thead: {
				allowEmpty: true,
				children: tableContentPasteSchema,
			},
			tfoot: {
				allowEmpty: true,
				children: tableContentPasteSchema,
			},
			tbody: {
				allowEmpty: true,
				children: tableContentPasteSchema,
			},
		},
	},
};

const transforms = {
	from: [
		{
			type: 'raw',
			selector: 'table',
			schema: tablePasteSchema,
		},
	],
};

export default transforms;
