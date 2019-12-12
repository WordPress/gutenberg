const transforms = {
	from: [
		{
			type: 'raw',
			isMatch: ( node ) => node.nodeName === 'FIGURE' && !! node.querySelector( 'iframe' ),
			schema: ( { phrasingContentSchema } ) => ( {
				figure: {
					require: [ 'iframe' ],
					children: {
						iframe: {
							attributes: [ 'src', 'allowfullscreen', 'height', 'width' ],
						},
						figcaption: {
							children: phrasingContentSchema,
						},
					},
				},
			} ),
		},
	],
};

export default transforms;
