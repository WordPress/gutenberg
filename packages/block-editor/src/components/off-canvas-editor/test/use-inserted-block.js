/**
 * Internal dependencies
 */
import { useInsertedBlock } from '../use-inserted-block';

/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * External dependencies
 */
import { act, renderHook } from '@testing-library/react';

jest.mock( '@wordpress/data/src/components/use-select', () => {
	// This allows us to tweak the returned value on each test.
	const mock = jest.fn();
	return mock;
} );

jest.mock( '@wordpress/data/src/components/use-dispatch', () => ( {
	useDispatch: jest.fn(),
} ) );

describe( 'useInsertedBlock', () => {
	const mockUpdateBlockAttributes = jest.fn();

	it( 'returns undefined values when called without a block clientId', () => {
		useSelect.mockImplementation( () => ( {
			insertedBlockAttributes: {
				'some-attribute': 'some-value',
			},
			insertedBlockName: 'core/navigation-link',
		} ) );

		useDispatch.mockImplementation( () => ( {
			updateBlockAttributes: mockUpdateBlockAttributes,
		} ) );

		const { result } = renderHook( () => useInsertedBlock() );

		const {
			insertedBlockName,
			insertedBlockAttributes,
			setInsertedBlockAttributes,
		} = result.current;

		expect( insertedBlockName ).toBeUndefined();
		expect( insertedBlockAttributes ).toBeUndefined();
		expect(
			setInsertedBlockAttributes( { 'some-attribute': 'new-value' } )
		).toBeUndefined();
	} );

	it( 'returns name and attributes when called with a block clientId', () => {
		useSelect.mockImplementation( () => ( {
			insertedBlockAttributes: {
				'some-attribute': 'some-value',
			},
			insertedBlockName: 'core/navigation-link',
		} ) );

		useDispatch.mockImplementation( () => ( {
			updateBlockAttributes: mockUpdateBlockAttributes,
		} ) );

		const { result } = renderHook( () =>
			useInsertedBlock( 'some-client-id-here' )
		);

		const { insertedBlockName, insertedBlockAttributes } = result.current;

		expect( insertedBlockName ).toBe( 'core/navigation-link' );
		expect( insertedBlockAttributes ).toEqual( {
			'some-attribute': 'some-value',
		} );
	} );

	it( 'dispatches updateBlockAttributes on provided client ID with new attributes when setInsertedBlockAttributes is called', () => {
		useSelect.mockImplementation( () => ( {
			insertedBlockAttributes: {
				'some-attribute': 'some-value',
			},
			insertedBlockName: 'core/navigation-link',
		} ) );

		useDispatch.mockImplementation( () => ( {
			updateBlockAttributes: mockUpdateBlockAttributes,
		} ) );

		const clientId = '123456789';

		const { result } = renderHook( () => useInsertedBlock( clientId ) );

		const { setInsertedBlockAttributes } = result.current;

		act( () => {
			setInsertedBlockAttributes( {
				'some-attribute': 'new-value',
			} );
		} );

		expect( mockUpdateBlockAttributes ).toHaveBeenCalledWith( clientId, {
			'some-attribute': 'new-value',
		} );
	} );
} );
