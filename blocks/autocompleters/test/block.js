/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import { registerBlockType, unregisterBlockType, getBlockTypes } from '../../api';
import { blockAutocompleter } from '../';

describe( 'block', () => {
	const blockTypes = {
		'core/foo': {
			save: noop,
			category: 'common',
			title: 'foo',
			keywords: [ 'foo-keyword-1', 'foo-keyword-2' ],
		},
		'core/bar': {
			save: noop,
			category: 'layout',
			title: 'bar',
			// Intentionally empty keyword list
			keywords: [],
		},
		'core/baz': {
			save: noop,
			category: 'common',
			title: 'baz',
			// Intentionally omitted keyword list
		},
	};

	beforeEach( () => {
		Object.entries( blockTypes ).forEach(
			( [ name, settings ] ) => registerBlockType( name, settings )
		);
	} );

	afterEach( () => {
		getBlockTypes().forEach( ( block ) => {
			unregisterBlockType( block.name );
		} );
	} );

	it( 'should prioritize common blocks in options', () => {
		return blockAutocompleter.options().then( ( options ) => {
			expect( options ).toMatchObject( [
				blockTypes[ 'core/foo' ],
				blockTypes[ 'core/baz' ],
				blockTypes[ 'core/bar' ],
			] );
		} );
	} );

	it( 'should render a block option label composed of @wordpress/element Elements and/or strings', () => {
		expect.hasAssertions();

		// Only verify that a populated label is returned.
		// It is likely to be fragile to assert that the contents are renderable by @wordpress/element.
		const isAllowedLabelType = ( label ) => Array.isArray( label ) || ( typeof label === 'string' );

		getBlockTypes().forEach( ( blockType ) => {
			const label = blockAutocompleter.getOptionLabel( blockType );
			expect( isAllowedLabelType( label ) ).toBeTruthy();
		} );
	} );

	it( 'should derive option keywords from block keywords and block title', () => {
		const optionKeywords = getBlockTypes().reduce(
			( map, blockType ) => map.set(
				blockType.name,
				blockAutocompleter.getOptionKeywords( blockType )
			),
			new Map()
		);

		expect( optionKeywords.get( 'core/foo' ) ).toEqual( [
			'foo-keyword-1',
			'foo-keyword-2',
			blockTypes[ 'core/foo' ].title,
		] );
		expect( optionKeywords.get( 'core/bar' ) ).toEqual( [
			blockTypes[ 'core/bar' ].title,
		] );
		expect( optionKeywords.get( 'core/baz' ) ).toEqual( [
			blockTypes[ 'core/baz' ].title,
		] );
	} );
} );
