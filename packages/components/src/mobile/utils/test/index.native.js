/**
 * Internal dependencies
 */
import { removeNonDigit, toFixed } from '../';
import { alignmentHelpers } from '../alignments.native.js';

/**
 * WordPress dependencies
 */
import {
	getBlockTypes,
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';

const { isContainerRelated } = alignmentHelpers;

describe( 'removeNonDigit', () => {
	it( 'function returns empty string if passed text does not contain digit characters', () => {
		const result = removeNonDigit( 'test' );
		expect( result ).toBe( '' );
	} );

	it( 'function removes non digit characters from passed text', () => {
		const result = removeNonDigit( 'test123' );
		expect( result ).toBe( '123' );
	} );

	it( 'function accepts dot character', () => {
		const result = removeNonDigit( '12.34', 2 );
		expect( result ).toBe( '12.34' );
	} );

	it( 'function accepts comma character', () => {
		const result = removeNonDigit( '12,34', 2 );
		expect( result ).toBe( '12,34' );
	} );
} );

describe( 'toFixed', () => {
	it( 'function returns the passed number if `decimalNum` is not specified', () => {
		const result = toFixed( '123' );
		expect( result ).toBe( 123 );
	} );

	it( 'function returns the number without decimals if `decimalNum` is not specified', () => {
		const result = toFixed( '123.4567' );
		expect( result ).toBe( 123 );
	} );

	it( 'function returns the number applying `decimalNum`', () => {
		const result = toFixed( '123.4567', 2 );
		expect( result ).toBe( 123.46 );
	} );

	it( 'function returns the number applying `decimalNum` all point numbers', () => {
		const toCheck = [
			1.01, 1.02, 1.03, 1.04, 1.05, 1.06, 1.07, 1.08, 1.09, 1.1,
		];
		toCheck.forEach( ( num ) => {
			const result = toFixed( num, 2 );
			expect( result ).toBe( num );
		} );
	} );

	it( 'function returns number without decimals if `decimalNum` is negative', () => {
		const result = toFixed( '12.34', -12 );
		expect( result ).toBe( 12 );
	} );
} );

describe( 'isContainerRelated', () => {
	const currentlySupportedBlocks = [
		'core/group',
		'core/columns',
		'core/column',
		'core/buttons',
		'core/button',
	];

	beforeAll( () => {
		const registerCoreBlocks =
			require( '@wordpress/block-library' ).registerCoreBlocks;
		registerCoreBlocks();
	} );

	afterAll( () => {
		getBlockTypes().forEach( ( blockname ) => {
			unregisterBlockType( blockname.name );
		} );
	} );

	it( 'function returns True for currently supported block types', () => {
		currentlySupportedBlocks.forEach( ( blockName ) => {
			const result = isContainerRelated( blockName );
			expect( result ).toBe( true );
		} );
	} );

	it( 'function returns false for currently NOT supported Blocks types', () => {
		getBlockTypes().forEach( ( blockType ) => {
			if ( currentlySupportedBlocks.includes( blockType.name ) ) {
				return;
			}
			const result = isContainerRelated( blockType.name );
			expect( result ).toBe( false );
		} );
	} );

	it( 'function return true from no core blocks if they meet the criteria', () => {
		registerBlockType( 'foo/bar', {
			title: 'Foo block',
			attributes: {},
			supports: {
				align: [ 'full' ],
			},
		} );

		const resultFoo = isContainerRelated( 'foo/bar' );
		expect( resultFoo ).toBe( true );

		registerBlockType( 'foo/bar-sup', {
			title: 'bar block',
			attributes: {},
			parent: [ 'foo/bar' ],
		} );

		const resultBar = isContainerRelated( 'foo/bar-sup' );
		expect( resultBar ).toBe( true );

		unregisterBlockType( 'foo/bar' );
		unregisterBlockType( 'foo/bar-sup' );
	} );
} );
