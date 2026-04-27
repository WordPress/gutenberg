/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import { formatTypes, disabledFormatTypesByBlock } from '../reducer';

describe( 'formatTypes', () => {
	it( 'should return an empty object as default state', () => {
		expect( formatTypes( undefined, {} ) ).toEqual( {} );
	} );

	it( 'should add a new format type', () => {
		const original = deepFreeze( {
			'core/bold': { name: 'core/bold' },
		} );

		const state = formatTypes( original, {
			type: 'ADD_FORMAT_TYPES',
			formatTypes: [ { name: 'core/code' } ],
		} );

		expect( state ).toEqual( {
			'core/bold': { name: 'core/bold' },
			'core/code': { name: 'core/code' },
		} );
	} );

	it( 'should remove format types', () => {
		const original = deepFreeze( {
			'core/bold': { name: 'core/bold' },
			'core/code': { name: 'core/code' },
		} );

		const state = formatTypes( original, {
			type: 'REMOVE_FORMAT_TYPES',
			names: [ 'core/code' ],
		} );

		expect( state ).toEqual( {
			'core/bold': { name: 'core/bold' },
		} );
	} );
} );

describe( 'disabledFormatTypesByBlock', () => {
	it( 'should return an empty object as default state', () => {
		expect( disabledFormatTypesByBlock( undefined, {} ) ).toEqual( {} );
	} );

	it( 'should disable a format type for a block', () => {
		const state = disabledFormatTypesByBlock( deepFreeze( {} ), {
			type: 'DISABLE_FORMAT_TYPE_IN_BLOCK',
			blockName: 'core/heading',
			formatName: 'core/italic',
		} );

		expect( state ).toEqual( {
			'core/heading': [ 'core/italic' ],
		} );
	} );

	it( 'should accumulate disabled format types for the same block', () => {
		const original = deepFreeze( {
			'core/heading': [ 'core/italic' ],
		} );

		const state = disabledFormatTypesByBlock( original, {
			type: 'DISABLE_FORMAT_TYPE_IN_BLOCK',
			blockName: 'core/heading',
			formatName: 'core/bold',
		} );

		expect( state ).toEqual( {
			'core/heading': [ 'core/italic', 'core/bold' ],
		} );
	} );

	it( 'should not duplicate a format type that is already disabled for a block', () => {
		const original = deepFreeze( {
			'core/heading': [ 'core/italic' ],
		} );

		const state = disabledFormatTypesByBlock( original, {
			type: 'DISABLE_FORMAT_TYPE_IN_BLOCK',
			blockName: 'core/heading',
			formatName: 'core/italic',
		} );

		expect( state ).toBe( original );
	} );

	it( 'should keep disabled entries for different blocks independent', () => {
		const original = deepFreeze( {
			'core/heading': [ 'core/italic' ],
		} );

		const state = disabledFormatTypesByBlock( original, {
			type: 'DISABLE_FORMAT_TYPE_IN_BLOCK',
			blockName: 'core/paragraph',
			formatName: 'core/bold',
		} );

		expect( state ).toEqual( {
			'core/heading': [ 'core/italic' ],
			'core/paragraph': [ 'core/bold' ],
		} );
	} );

	it( 'should re-enable a format type for a block', () => {
		const original = deepFreeze( {
			'core/heading': [ 'core/italic', 'core/bold' ],
		} );

		const state = disabledFormatTypesByBlock( original, {
			type: 'ENABLE_FORMAT_TYPE_IN_BLOCK',
			blockName: 'core/heading',
			formatName: 'core/italic',
		} );

		expect( state ).toEqual( {
			'core/heading': [ 'core/bold' ],
		} );
	} );

	it( 'should remove the block key when all formats are re-enabled', () => {
		const original = deepFreeze( {
			'core/heading': [ 'core/italic' ],
		} );

		const state = disabledFormatTypesByBlock( original, {
			type: 'ENABLE_FORMAT_TYPE_IN_BLOCK',
			blockName: 'core/heading',
			formatName: 'core/italic',
		} );

		expect( state ).toEqual( {} );
		expect( state ).not.toHaveProperty( 'core/heading' );
	} );

	it( 'should return the same state when re-enabling for an unknown block', () => {
		const original = deepFreeze( {} );

		const state = disabledFormatTypesByBlock( original, {
			type: 'ENABLE_FORMAT_TYPE_IN_BLOCK',
			blockName: 'core/heading',
			formatName: 'core/italic',
		} );

		expect( state ).toBe( original );
	} );
} );
