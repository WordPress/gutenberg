export const isSupportedBlock = ( blockName ) =>
	[ 'core/image', 'core/cover' ].includes( blockName );

export const richImageAttributes = {
	imageCropWidth: {
		type: 'number',
		default: 200,
	},
	imageCropHeight: {
		type: 'number',
		default: 200,
	},
	imageCropX: {
		type: 'number',
		default: 0,
	},
	imageCropY: {
		type: 'number',
		default: 0,
	},
};
