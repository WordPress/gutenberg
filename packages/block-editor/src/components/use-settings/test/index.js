/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { addFilter, removeFilter } from '@wordpress/hooks';
import { useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSettings, useSetting } from '..';
import * as BlockEditContext from '../../block-edit/context';

// Mock useSelect() functions used by useSettings()
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

const mockCurrentBlockContext = (
	blockContext = { name: '', isSelected: false }
) => {
	jest.spyOn( BlockEditContext, 'useBlockEditContext' ).mockReturnValue(
		blockContext
	);
};

function runHook( hookCb ) {
	let storedResult;
	function TestHook() {
		const result = hookCb();
		useEffect( () => {
			storedResult = result;
		}, [ result ] );
	}
	render( <TestHook /> );
	return storedResult;
}

describe( 'useSettings', () => {
	beforeEach( () => {
		setupSelectMock();
		mockCurrentBlockContext();
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

		const result = runHook( () => useSettings( 'layout.contentSize' ) );
		expect( result ).toEqual( [ '840px' ] );
	} );

	it( 'uses blockEditor.useSetting.before hook override', () => {
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
			( result, path, clientId, blockName ) => {
				if ( blockName === 'core/test-block' ) {
					return '960px';
				}

				return result;
			}
		);

		const result = runHook( () => useSettings( 'layout.contentSize' ) );
		expect( result ).toEqual( [ '960px' ] );

		removeFilter(
			'blockEditor.useSetting.before',
			'test/useSetting.before'
		);
	} );

	it( 'supports also the deprecated useSetting function', () => {
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

		const result = runHook( () => useSetting( 'layout.contentSize' ) );
		expect( result ).toBe( '840px' );
		expect( console ).toHaveWarnedWith(
			'wp.blockEditor.useSetting is deprecated since version 6.5. Please use wp.blockEditor.useSettings instead.'
		);
	} );
} );
