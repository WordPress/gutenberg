export const ROOT_LEVEL_ID = 'e59528f8-fb35-4ec1-aec6-5a065c236fa1';
export const ROOT_LEVEL_WITH_INNER_BLOCKS_ID =
	'72a9220f-4c3d-4b00-bae1-4506513f63d8';
export const NESTED_WITH_INNER_BLOCKS_ID =
	'9f3d1f1e-df85-485d-af63-dc8cb1b93cbc';
export const DEEP_NESTED_ID = 'abec845a-e4de-43fb-96f7-80dc3d51ad7a';

export const BLOCKS_LAYOUTS_DATA = {
	[ ROOT_LEVEL_ID ]: {
		clientId: ROOT_LEVEL_ID,
		width: 390,
		height: 54,
		x: 0,
		y: 83,
		innerBlocks: {},
	},
	[ ROOT_LEVEL_WITH_INNER_BLOCKS_ID ]: {
		clientId: ROOT_LEVEL_WITH_INNER_BLOCKS_ID,
		width: 390,
		height: 386,
		x: 0,
		y: 137,
		innerBlocks: {
			'62839858-48b0-44ed-b834-1343a1357e54': {
				clientId: '62839858-48b0-44ed-b834-1343a1357e54',
				rootClientId: ROOT_LEVEL_WITH_INNER_BLOCKS_ID,
				width: 390,
				height: 54,
				x: 0,
				y: 0,
				innerBlocks: {},
			},
			[ NESTED_WITH_INNER_BLOCKS_ID ]: {
				clientId: NESTED_WITH_INNER_BLOCKS_ID,
				rootClientId: ROOT_LEVEL_WITH_INNER_BLOCKS_ID,
				width: 390,
				height: 332,
				x: 0,
				y: 54,
				innerBlocks: {
					'435d62a4-afa7-457c-a894-b04390d7b447': {
						clientId: '435d62a4-afa7-457c-a894-b04390d7b447',
						rootClientId: NESTED_WITH_INNER_BLOCKS_ID,
						width: 358,
						height: 54,
						x: 0,
						y: 0,
						innerBlocks: {},
					},
					[ DEEP_NESTED_ID ]: {
						clientId: DEEP_NESTED_ID,
						rootClientId: NESTED_WITH_INNER_BLOCKS_ID,
						width: 358,
						height: 98,
						x: 0,
						y: 54,
						innerBlocks: {},
					},
				},
			},
		},
	},
};

export const PARAGRAPH_BLOCK_LAYOUT_DATA = {
	clientId: '22dda04f-4718-45b2-8cd2-36cedb9eae4d',
	width: 390,
	height: 98,
	x: 0,
	y: 83,
};

export const GROUP_BLOCK_LAYOUT_DATA = {
	clientId: 'e18249d9-ec06-4f54-b71e-6ec59be5213e',
	width: 390,
	height: 164,
	x: 0,
	y: 83,
};
