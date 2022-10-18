/**
 * WordPress dependencies
 */
import { addFilter, removeFilter } from '@wordpress/hooks';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import useSetting from '..';
import * as BlockEditContext from '../../block-edit/context';

// Mock useSelect() functions used by useSetting()
jest.mock( '@wordpress/data/src/components/use-select' );

let selectMock = {};
const setupSelectMock = () => {
	selectMock = {
		getSettings: () => ( {} ),
		getBlockParents: () => [],
		getBlockName: () => '',
	};
};

useSelect.mockImplementation( ( callback ) => callback( () => selectMock ) );

const mockSettings = ( settings ) => {
	selectMock.getSettings = () => ( {
		__experimentalFeatures: settings,
	} );
};

const mockBlockName = ( blockClientId, blockName ) => {
	selectMock.getBlockName = ( clientId ) => {
		if ( clientId === blockClientId ) {
			return blockName;
		}
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
		setupSelectMock();
		mockCurrentBlockContext( {} );
	} );

	it( 'uses block setting', () => {
		mockSettings( {
			blocks: {
				'core/test-block': {
					layout: {
						contentSize: '840px',
					},
				},
			},
		} );

		mockCurrentBlockContext( {
			name: 'core/test-block',
		} );

		expect( useSetting( 'layout.contentSize' ) ).toBe( '840px' );
	} );

	it( 'uses hook override', () => {
		mockSettings( {
			blocks: {
				'core/test-block': {
					layout: {
						contentSize: '840px',
					},
				},
			},
		} );

		mockCurrentBlockContext( {
			name: 'core/test-block',
		} );

		addFilter(
			'blockEditor.useSetting.before',
			'test/useSetting.before',
			( result, blockName ) => {
				if ( blockName === 'core/test-block' ) {
					return '960px';
				}

				return result;
			}
		);

		expect( useSetting( 'layout.contentSize' ) ).toBe( '960px' );

		removeFilter(
			'blockEditor.useSetting.before',
			'test/useSetting.before'
		);
	} );
} );
