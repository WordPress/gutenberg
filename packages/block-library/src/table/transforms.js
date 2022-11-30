const tableContentPasteSchema = ( { phrasingContentSchema } ) => ( {
	tr: {
		allowEmpty: true,
		children: {
			th: {
				allowEmpty: true,
				children: phrasingContentSchema,
				attributes: [ 'scope', 'colspan' ],
			},
			td: {
				allowEmpty: true,
				children: phrasingContentSchema,
				attributes: [ 'colspan' ],
			},
		},
	},
} );

const tablePasteSchema = ( args ) => ( {
	table: {
		children: {
			thead: {
				allowEmpty: true,
				children: tableContentPasteSchema( args ),
			},
			tfoot: {
				allowEmpty: true,
				children: tableContentPasteSchema( args ),
			},
			tbody: {
				allowEmpty: true,
				children: tableContentPasteSchema( args ),
			},
		},
	},
} );

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
