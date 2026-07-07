/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { addFilter, removeFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import useHeadingBlockTypes from '../use-heading-block-types';

describe( 'useHeadingBlockTypes', () => {
	afterEach( () => {
		removeFilter( 'editor.headingBlockTypes', 'test/heading-block-types' );
	} );

	it( 'defaults to core/heading only', () => {
		const { result } = renderHook( () => useHeadingBlockTypes() );

		expect( result.current ).toEqual( [ 'core/heading' ] );
	} );

	it( 'includes block types added via the editor.headingBlockTypes filter', () => {
		addFilter(
			'editor.headingBlockTypes',
			'test/heading-block-types',
			( blockTypes ) => [ ...blockTypes, 'my-plugin/section-heading' ]
		);

		const { result } = renderHook( () => useHeadingBlockTypes() );

		expect( result.current ).toEqual( [
			'core/heading',
			'my-plugin/section-heading',
		] );
	} );
} );
