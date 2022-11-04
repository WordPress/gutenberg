const transforms = {
	to: [
		{
			type: 'block',
			blocks: [ '*' ],
			transform: ( attributes, innerBlocks ) => innerBlocks,
		},
	],
};

export default transforms;
