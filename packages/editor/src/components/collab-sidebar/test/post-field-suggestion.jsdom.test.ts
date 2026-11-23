import { describe, expect, it } from 'vitest';
import { isOpenPostFieldSuggestion } from '../utils/post-field-suggestion';

function payload( operations: object[] ) {
	return JSON.stringify( { schemaVersion: 1, operations } );
}

const titleOp = {
	type: 'post-attribute-set',
	attribute: 'title',
	before: 'Old',
	after: 'New',
};

describe( 'isOpenPostFieldSuggestion', () => {
	it( 'accepts an undecided post field suggestion', () => {
		expect(
			isOpenPostFieldSuggestion( {
				status: 'hold',
				meta: { _wp_suggestion: payload( [ titleOp ] ) },
			} )
		).toBe( true );
	} );

	it( 'rejects a decided post field suggestion', () => {
		expect(
			isOpenPostFieldSuggestion( {
				status: 'approved',
				meta: { _wp_suggestion: payload( [ titleOp ] ) },
			} )
		).toBe( false );
	} );

	it( 'rejects a decision the post is not saved with yet', () => {
		expect(
			isOpenPostFieldSuggestion( {
				status: 'hold',
				meta: {
					_wp_suggestion: payload( [ titleOp ] ),
					_wp_suggestion_status: 'applied-unsaved',
				},
			} )
		).toBe( false );
	} );

	it( 'rejects a block suggestion and a plain note', () => {
		expect(
			isOpenPostFieldSuggestion( {
				status: 'hold',
				meta: {
					_wp_suggestion: payload( [
						{ type: 'attribute-set', attribute: 'level' },
					] ),
				},
			} )
		).toBe( false );
		expect( isOpenPostFieldSuggestion( { status: 'hold' } ) ).toBe( false );
	} );
} );
