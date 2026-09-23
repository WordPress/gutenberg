import { describe, expect, it } from 'vitest';
import { getMultiSelectionAttributeUpdates } from '../multi-selection-attributes';

/**
 * Builds the `attributesByClientId` map from a list of block attributes, so
 * that the first entry is the primary block, the second `client-1`, and so on.
 *
 * @param {Object[]} attributesList Attributes of each selected block.
 *
 * @return {Object} Attributes keyed by client ID.
 */
const byClientId = ( attributesList ) =>
	Object.fromEntries(
		attributesList.map( ( attributes, index ) => [
			`client-${ index }`,
			attributes,
		] )
	);

describe( 'getMultiSelectionAttributeUpdates', () => {
	it( 'returns undefined for an empty payload', () => {
		expect(
			getMultiSelectionAttributeUpdates(
				{ content: 'a' },
				{},
				byClientId( [ { content: 'a' } ] )
			)
		).toBeUndefined();
	} );

	it( 'returns undefined when the payload matches the primary block attributes', () => {
		expect(
			getMultiSelectionAttributeUpdates(
				{ content: 'a', fontSize: 'large' },
				{ fontSize: 'large' },
				byClientId( [
					{ content: 'a', fontSize: 'large' },
					{ content: 'b' },
				] )
			)
		).toBeUndefined();
	} );

	it( 'returns undefined when an object attribute is repeated unchanged', () => {
		expect(
			getMultiSelectionAttributeUpdates(
				{ style: { color: { text: 'red' } } },
				// A new object holding the values the primary block already has.
				{ style: { color: { text: 'red' } } },
				byClientId( [
					{ style: { color: { text: 'red' } } },
					{ style: { color: { text: 'green' } } },
				] )
			)
		).toBeUndefined();
	} );

	it( 'applies a changed scalar attribute to every block', () => {
		expect(
			getMultiSelectionAttributeUpdates(
				{ content: 'a', align: 'left' },
				{ align: 'center' },
				byClientId( [
					{ content: 'a', align: 'left' },
					{ content: 'b' },
				] )
			)
		).toEqual( {
			'client-0': { align: 'center' },
			'client-1': { align: 'center' },
		} );
	} );

	it( 'propagates an explicit undefined clear to every block', () => {
		expect(
			getMultiSelectionAttributeUpdates(
				{ fontSize: 'large' },
				{ fontSize: undefined },
				byClientId( [
					{ fontSize: 'large' },
					{ fontSize: 'small' },
					{},
				] )
			)
		).toStrictEqual( {
			'client-0': { fontSize: undefined },
			'client-1': { fontSize: undefined },
			'client-2': { fontSize: undefined },
		} );
	} );

	it( 'replaces an array attribute rather than merging it', () => {
		expect(
			getMultiSelectionAttributeUpdates(
				{ values: [ 'a', 'b' ] },
				{ values: [ 'c' ] },
				byClientId( [ { values: [ 'a', 'b' ] }, { values: [ 'x' ] } ] )
			)
		).toEqual( {
			'client-0': { values: [ 'c' ] },
			'client-1': { values: [ 'c' ] },
		} );
	} );

	it( 'leaves attributes absent from the payload untouched', () => {
		expect(
			getMultiSelectionAttributeUpdates(
				{ content: 'a', textColor: 'white' },
				{ textColor: 'black' },
				byClientId( [
					{ content: 'a', textColor: 'white' },
					{ content: 'b' },
				] )
			)
		).toEqual( {
			'client-0': { textColor: 'black' },
			'client-1': { textColor: 'black' },
		} );
	} );

	it( 'merges a nested style change into each block style, preserving distinct branches', () => {
		expect(
			getMultiSelectionAttributeUpdates(
				{ style: { color: { background: 'red' } } },
				{ style: { color: { background: 'red', text: 'white' } } },
				byClientId( [
					{ style: { color: { background: 'red' } } },
					{ style: { color: { background: 'green' } } },
				] )
			)
		).toEqual( {
			'client-0': {
				style: { color: { background: 'red', text: 'white' } },
			},
			'client-1': {
				style: { color: { background: 'green', text: 'white' } },
			},
		} );
	} );

	it( 'propagates nested deletions within an object attribute', () => {
		expect(
			getMultiSelectionAttributeUpdates(
				{
					style: {
						typography: { fontSize: '20px', lineHeight: '1.5' },
					},
				},
				{ style: { typography: { lineHeight: '1.5' } } },
				byClientId( [
					{
						style: {
							typography: { fontSize: '20px', lineHeight: '1.5' },
						},
					},
					{
						style: {
							typography: { fontSize: '16px' },
							color: { text: 'red' },
						},
					},
				] )
			)
		).toEqual( {
			'client-0': { style: { typography: { lineHeight: '1.5' } } },
			// The typography branch is emptied by the deletion, so it is
			// dropped rather than left behind as an empty object.
			'client-1': { style: { color: { text: 'red' } } },
		} );
	} );

	it( 'merges a new object attribute into each block instead of replacing it', () => {
		expect(
			getMultiSelectionAttributeUpdates(
				{},
				{ style: { typography: { fontSize: '20px' } } },
				byClientId( [ {}, { style: { color: { text: 'red' } } } ] )
			)
		).toEqual( {
			'client-0': { style: { typography: { fontSize: '20px' } } },
			'client-1': {
				style: {
					color: { text: 'red' },
					typography: { fontSize: '20px' },
				},
			},
		} );
	} );

	it( 'clears only the primary block branches when an object attribute is emptied', () => {
		expect(
			getMultiSelectionAttributeUpdates(
				{ style: { typography: { fontSize: '20px' } } },
				{ style: undefined },
				byClientId( [
					{ style: { typography: { fontSize: '20px' } } },
					{ style: { color: { text: 'red' } } },
				] )
			)
		).toStrictEqual( {
			'client-0': { style: undefined },
			'client-1': { style: { color: { text: 'red' } } },
		} );
	} );
} );
