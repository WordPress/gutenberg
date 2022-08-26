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

const mockBlockParent = (
	childClientId,
	{ clientId: parentBlockClientId, name: parentBlockName }
) => {
	const previousGetBlockParents = selectMock.getBlockParents;

	selectMock.getBlockParents = ( clientId ) => {
		if ( clientId === childClientId ) {
			return [ parentBlockClientId ];
		}

		return previousGetBlockParents( clientId );
	};

	mockBlockName( parentBlockClientId, parentBlockName );
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

	it( 'uses 1-layer deep nested block setting', () => {
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
} );
