/**
 * Internal dependencies
 */
import {
	getFieldType,
	registerFieldType,
	resolveFields,
	unregisterFieldType,
} from '../field-types';
import type { FieldTypeDefinition, ResolvableField } from '../field-types';

const RatingControl = () => null;
const ratingValidator = () => null;

const rating: FieldTypeDefinition = {
	name: 'test/rating',
	baseType: 'integer',
	Edit: RatingControl,
	isValid: { custom: ratingValidator },
};

afterEach( () => {
	unregisterFieldType( 'test/rating' );
} );

describe( 'registerFieldType', () => {
	it( 'registers and returns the definition', () => {
		expect( registerFieldType( rating ) ).toBe( rating );
		expect( getFieldType( 'test/rating' ) ).toBe( rating );
	} );

	it( 'registers plain names', () => {
		const plain = { ...rating, name: 'rating' };

		expect( registerFieldType( plain ) ).toBe( plain );
		expect( getFieldType( 'rating' ) ).toBe( plain );

		unregisterFieldType( 'rating' );
	} );

	it( 'ignores invalid names', () => {
		const invalid = { ...rating, name: 'Not-Valid' };

		expect( registerFieldType( invalid ) ).toBeUndefined();
		expect( getFieldType( 'Not-Valid' ) ).toBeUndefined();
	} );

	it( 'keeps the first registration on duplicate names', () => {
		registerFieldType( rating );
		const second = { ...rating };

		expect( registerFieldType( second ) ).toBeUndefined();
		expect( getFieldType( 'test/rating' ) ).toBe( rating );
	} );
} );

describe( 'unregisterFieldType', () => {
	it( 'removes and returns the definition', () => {
		registerFieldType( rating );

		expect( unregisterFieldType( 'test/rating' ) ).toBe( rating );
		expect( getFieldType( 'test/rating' ) ).toBeUndefined();
	} );

	it( 'returns undefined for unknown names', () => {
		expect( unregisterFieldType( 'test/unknown' ) ).toBeUndefined();
	} );
} );

describe( 'resolveFields', () => {
	it( 'passes fields with DataViews types through untouched', () => {
		const field: ResolvableField = { id: 'location', type: 'text' };

		expect( resolveFields( [ field ] )[ 0 ] ).toBe( field );
	} );

	it( 'passes fields with unregistered namespaced types through untouched', () => {
		const field: ResolvableField = { id: 'score', type: 'acme/stars' };

		expect( resolveFields( [ field ] )[ 0 ] ).toBe( field );
	} );

	it( 'translates a registered type into per-field props', () => {
		registerFieldType( rating );
		const field = {
			id: 'score',
			type: 'test/rating',
			label: 'Score',
			relevance: 'high',
		} as ResolvableField & { relevance: string };

		const [ resolved ] = resolveFields( [ field ] );

		expect( resolved ).toEqual( {
			id: 'score',
			type: 'integer',
			label: 'Score',
			relevance: 'high',
			Edit: RatingControl,
			isValid: { custom: ratingValidator },
		} );
		expect( resolved ).not.toHaveProperty( 'name' );
		expect( resolved ).not.toHaveProperty( 'baseType' );
	} );

	it( 'resolves plain registered names', () => {
		registerFieldType( { ...rating, name: 'rating' } );
		const field: ResolvableField = { id: 'score', type: 'rating' };

		expect( resolveFields( [ field ] )[ 0 ].type ).toBe( 'integer' );

		unregisterFieldType( 'rating' );
	} );

	it( 'lets the field props win over the definition defaults', () => {
		registerFieldType( rating );
		const FieldEdit = () => null;
		const field: ResolvableField = {
			id: 'score',
			type: 'test/rating',
			Edit: FieldEdit,
		};

		expect( resolveFields( [ field ] )[ 0 ].Edit ).toBe( FieldEdit );
	} );

	it( 'merges isValid rule by rule, field rules winning', () => {
		registerFieldType( rating );
		const fieldValidator = () => null;
		const field: ResolvableField = {
			id: 'score',
			type: 'test/rating',
			isValid: { required: true, custom: fieldValidator },
		};

		expect( resolveFields( [ field ] )[ 0 ].isValid ).toEqual( {
			required: true,
			custom: fieldValidator,
		} );
	} );

	it( 'resolves to an untyped field when the definition has no baseType', () => {
		registerFieldType( {
			name: 'test/untyped',
			Edit: RatingControl,
		} );
		const field: ResolvableField = { id: 'score', type: 'test/untyped' };

		const [ resolved ] = resolveFields( [ field ] );

		expect( resolved.type ).toBeUndefined();
		expect( resolved.Edit ).toBe( RatingControl );

		unregisterFieldType( 'test/untyped' );
	} );
} );
