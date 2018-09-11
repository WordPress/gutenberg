/**
 * WordPress dependencies
 */
import {
	getBlockTypes,
	unregisterBlockType,
	registerBlockType,
	createBlock,
	getDefaultBlockName,
	setDefaultBlockName,
	getUnknownTypeHandlerName,
	setUnknownTypeHandlerName,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import {
	isSingleUnknownBlock,
	isSingleUnmodifiedDefaultBlock,
	omitSingleUnmodifiedDefaultBlock,
	removepSingleUnknownBlock,
} from '../process-content';

describe( 'processContent', () => {
	let originalDefaultBlockName, originalUnknownTypeHandlerName;

	beforeAll( () => {
		originalDefaultBlockName = getDefaultBlockName();
		originalUnknownTypeHandlerName = getUnknownTypeHandlerName();

		registerBlockType( 'core/default', {
			category: 'common',
			title: 'default',
			attributes: {
				modified: {
					type: 'boolean',
					default: false,
				},
			},
			save: () => null,
		} );
		registerBlockType( 'core/unknown', {
			category: 'common',
			title: 'unknown',
			save: () => null,
		} );
		setDefaultBlockName( 'core/default' );
		setUnknownTypeHandlerName( 'core/unknown' );
	} );

	afterAll( () => {
		setDefaultBlockName( originalDefaultBlockName );
		setUnknownTypeHandlerName( originalUnknownTypeHandlerName );
		getBlockTypes().forEach( ( block ) => {
			unregisterBlockType( block.name );
		} );
	} );

	describe( 'isSingleUnknownBlock', () => {
		it( 'returns false if multiple blocks passed', () => {
			const blocks = [
				createBlock( getUnknownTypeHandlerName() ),
				createBlock( getUnknownTypeHandlerName() ),
			];

			const result = isSingleUnknownBlock( blocks );

			expect( result ).toBe( false );
		} );

		it( 'returns false if single block not of unknown type', () => {
			const blocks = [
				createBlock( getDefaultBlockName() ),
			];

			const result = isSingleUnknownBlock( blocks );

			expect( result ).toBe( false );
		} );

		it( 'returns true if single block of unknown type', () => {
			const blocks = [
				createBlock( getUnknownTypeHandlerName() ),
			];

			const result = isSingleUnknownBlock( blocks );

			expect( result ).toBe( true );
		} );
	} );

	describe( 'isSingleUnmodifiedDefaultBlock', () => {
		it( 'returns false if multiple blocks passed', () => {
			const blocks = [
				createBlock( getDefaultBlockName() ),
				createBlock( getDefaultBlockName() ),
			];

			const result = isSingleUnmodifiedDefaultBlock( blocks );

			expect( result ).toBe( false );
		} );

		it( 'returns false if single non-default block', () => {
			const blocks = [
				createBlock( getUnknownTypeHandlerName() ),
			];

			const result = isSingleUnmodifiedDefaultBlock( blocks );

			expect( result ).toBe( false );
		} );

		it( 'returns false if single modified default block', () => {
			const blocks = [
				createBlock( getDefaultBlockName(), { modified: true } ),
			];

			const result = isSingleUnmodifiedDefaultBlock( blocks );

			expect( result ).toBe( false );
		} );

		it( 'returns true if single unmodified default block', () => {
			const blocks = [
				createBlock( getDefaultBlockName() ),
			];

			const result = isSingleUnmodifiedDefaultBlock( blocks );

			expect( result ).toBe( true );
		} );
	} );

	describe( 'omitSingleUnmodifiedDefaultBlock', () => {
		it( 'returns original array of blocks if not single unmodified default block', () => {
			const blocks = [
				createBlock( getUnknownTypeHandlerName() ),
			];

			const result = omitSingleUnmodifiedDefaultBlock( blocks );

			expect( result ).toBe( blocks );
		} );

		it( 'returns an empty array if single unmodified default block', () => {
			const blocks = [
				createBlock( getDefaultBlockName() ),
			];

			const result = omitSingleUnmodifiedDefaultBlock( blocks );

			expect( result ).toEqual( [] );
		} );
	} );

	describe( 'removepSingleUnknownBlock', () => {
		it( 'returns original content if not single block of unknown type', () => {
			const blocks = [
				createBlock( getDefaultBlockName() ),
			];

			const result = removepSingleUnknownBlock( '<p>foo</p>', blocks );

			expect( result ).toBe( '<p>foo</p>' );
		} );

		it( 'returns removep-formatted content if single block of unknown type', () => {
			const blocks = [
				createBlock( getUnknownTypeHandlerName() ),
			];

			const result = removepSingleUnknownBlock( '<p>foo</p>', blocks );

			expect( result ).toBe( 'foo' );
		} );
	} );
} );
