/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import useSetting from '..';
import * as BlockEditContext from '../../block-edit/context';

// useSelect() mock functions for blockEditorStore
jest.mock( '@wordpress/data/src/components/use-select' );

let selectMock = {};

useSelect.mockImplementation( ( callback ) => callback( () => selectMock ) );

const mockSettings = ( settings ) => {
	selectMock.getSettings = () => ( {
		__experimentalFeatures: settings,
	} );
};

let blockParentMap = {};

const mockBlockParent = (
	childClientId,
	{ clientId: parentClientId, name: parentName }
) => {
	mockBlockName( parentClientId, parentName );

	blockParentMap[ childClientId ] = parentClientId;

	selectMock.getBlockParents = ( clientId ) => {
		const parents = [];
		let current = clientId;

		while ( !! blockParentMap[ current ] ) {
			current = blockParentMap[ current ];
			parents.push( current );
		}

		return parents;
	};
};

const mockBlockName = ( blockClientId, blockName ) => {
	const previousGetBlockName = selectMock.getBlockName;

	selectMock.getBlockName = ( clientId ) => {
		if ( clientId === blockClientId ) {
			return blockName;
		}

		return previousGetBlockName( clientId );
	};
};

const mockCurrentBlockContext = (
	blockContext = { name: '', isSelected: false }
) => {
	if ( blockContext.name !== '' && blockContext.clientID !== undefined ) {
		mockBlockName( blockContext.clientID, blockContext.name );
	}

	jest.spyOn( BlockEditContext, 'useBlockEditContext' ).mockReturnValue(
		blockContext
	);
};

describe( 'useSetting', () => {
	beforeEach( () => {
		selectMock = {
			getSettings: () => ( {} ),
			getBlockParents: () => [],
			getBlockName: () => '',
		};

		mockCurrentBlockContext( {} );

		blockParentMap = {};
	} );

	it( 'uses theme setting', () => {
		mockSettings( {
			color: {
				text: false,
			},
		} );

		expect( useSetting( 'color.text' ) ).toBe( false );
	} );

	it( 'uses block-specific setting', () => {
		mockSettings( {
			color: {
				text: false,
			},
			blocks: {
				'core/test-block': {
					color: {
						text: true,
					},
				},
			},
		} );

		mockCurrentBlockContext( {
			name: 'core/test-block',
		} );

		expect( useSetting( 'color.text' ) ).toBe( true );
	} );

	it( 'does not use block-specific setting from another block', () => {
		mockSettings( {
			color: {
				text: false,
			},
			blocks: {
				'core/test-block': {
					color: {
						text: true,
					},
				},
			},
		} );

		mockCurrentBlockContext( {
			name: 'core/unrelated-block',
		} );

		expect( useSetting( 'color.text' ) ).toBe( false );
	} );

	it( 'uses 2-layer deep nested block setting', () => {
		mockSettings( {
			color: {
				text: false,
			},
			blocks: {
				'core/parent-block': {
					color: {
						text: false,
					},
					'core/child-block': {
						color: {
							text: true,
						},
					},
				},
			},
		} );

		// Mock editor structure:
		//	core/parent-block {
		//		core/child-block    <- current block
		//	}

		mockCurrentBlockContext( {
			name: 'core/child-block',
			clientId: 'client-id-child-block',
		} );

		mockBlockParent( 'client-id-child-block', {
			name: 'core/parent-block',
			clientId: 'client-id-parent-block',
		} );

		expect( useSetting( 'color.text' ) ).toBe( true );
	} );

	it( 'uses 3-layer deep nested block setting', () => {
		mockSettings( {
			color: {
				text: false,
			},
			blocks: {
				'core/grandparent-block': {
					'core/parent-block': {
						'core/child-block': {
							color: {
								text: true,
							},
						},
					},
				},
			},
		} );

		// Mock editor structure:
		//	core/grandparent-block {
		//		core/parent-block {
		//			core/child-block    <- current block
		//		}
		//	}

		mockCurrentBlockContext( {
			name: 'core/child-block',
			clientId: 'client-id-child-block',
		} );

		mockBlockParent( 'client-id-child-block', {
			name: 'core/parent-block',
			clientId: 'client-id-parent-block',
		} );

		mockBlockParent( 'client-id-parent-block', {
			name: 'core/grandparent-block',
			clientId: 'client-id-grandparent-block',
		} );

		expect( useSetting( 'color.text' ) ).toBe( true );
	} );

	it( 'uses grandparent 2-layer deep nested block setting', () => {
		mockSettings( {
			color: {
				text: false,
			},
			blocks: {
				'core/grandparent-block': {
					'core/child-block': {
						color: {
							text: true,
						},
					},
				},
			},
		} );

		// Mock editor structure:
		//	core/grandparent-block {
		//		core/parent-block {
		//			core/child-block    <- current block
		//		}
		//	}

		mockCurrentBlockContext( {
			name: 'core/child-block',
			clientId: 'client-id-child-block',
		} );

		mockBlockParent( 'client-id-child-block', {
			name: 'core/parent-block',
			clientId: 'client-id-parent-block',
		} );

		mockBlockParent( 'client-id-parent-block', {
			name: 'core/grandparent-block',
			clientId: 'client-id-grandparent-block',
		} );

		expect( useSetting( 'color.text' ) ).toBe( true );
	} );

	it( 'uses more specific nested block setting', () => {
		mockSettings( {
			blocks: {
				'core/child-block': {
					color: {
						text: false,
					},
				},
				'core/parent-block': {
					'core/child-block': {
						color: {
							text: true,
						},
					},
				},
			},
		} );

		// Mock editor structure:
		//	core/parent-block {
		//		core/child-block    <- current block
		//	}

		mockCurrentBlockContext( {
			name: 'core/child-block',
			clientId: 'client-id-child-block',
		} );

		mockBlockParent( 'client-id-child-block', {
			name: 'core/parent-block',
			clientId: 'client-id-parent-block',
		} );

		expect( useSetting( 'color.text' ) ).toBe( true );
	} );

	it( 'uses correct specificity in double-layered parent block', () => {
		mockSettings( {
			blocks: {
				'core/nested-block': {
					'core/nested-block': {
						'core/child-block': {
							color: {
								text: true,
							},
						},
					},
					'core/child-block': {
						color: {
							text: false,
						},
					},
				},
			},
		} );

		// Mock editor structure:
		//	core/nested-block {
		//		core/nested-block {
		//			core/child-block    <- current block
		//		}
		//	}

		mockCurrentBlockContext( {
			name: 'core/child-block',
			clientId: 'client-id-child-block',
		} );

		mockBlockParent( 'client-id-child-block', {
			name: 'core/nested-block',
			clientId: 'client-id-nested-block-1',
		} );

		mockBlockParent( 'client-id-nested-block-1', {
			name: 'core/nested-block',
			clientId: 'client-id-nested-block-2',
		} );

		expect( useSetting( 'color.text' ) ).toBe( true );
	} );

	it( 'uses correct specificity out of double-layered parent block', () => {
		mockSettings( {
			blocks: {
				'core/nested-block': {
					'core/nested-block': {
						'core/child-block': {
							color: {
								text: true,
							},
						},
					},
					'core/child-block': {
						color: {
							text: false,
						},
					},
				},
			},
		} );

		// Mock editor structure:
		//	core/nested-block {
		//		core/child-block    <- current block
		//	}

		mockCurrentBlockContext( {
			name: 'core/child-block',
			clientId: 'client-id-child-block',
		} );

		mockBlockParent( 'client-id-child-block', {
			name: 'core/nested-block',
			clientId: 'client-id-nested-block',
		} );
		expect( useSetting( 'color.text' ) ).toBe( false );
	} );
} );
