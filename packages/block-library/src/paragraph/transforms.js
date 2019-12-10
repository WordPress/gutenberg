const transforms = {
	from: [
		{
			type: 'raw',
			// Paragraph is a fallback and should be matched last.
			priority: 20,
			selector: 'p',
			schema: ( { phrasingContentSchema } ) => ( {
				p: {
					children: phrasingContentSchema,
				},
			} ),
		},
	],
};

export default transforms;
