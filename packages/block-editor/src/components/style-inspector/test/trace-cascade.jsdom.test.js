import { describe, expect, it } from 'vitest';
import {
	compareDeclarations,
	traceCascade,
	traceOtherProperties,
} from '../trace-cascade';
import { getInspectorGroups } from '../properties';

const properties = getInspectorGroups().flatMap(
	( group ) => group.properties
);
const byLonghand = ( longhand ) =>
	properties.filter( ( property ) => property.longhands[ 0 ] === longhand );

function setUp( css, html ) {
	document.head.innerHTML = `<style>${ css }</style>`;
	document.body.innerHTML = html;
}

describe( 'compareDeclarations', () => {
	const base = {
		important: false,
		inline: false,
		layered: false,
		specificity: [ 0, 1, 0 ],
		order: 1,
	};

	it( 'lets !important win over inline styles', () => {
		expect(
			compareDeclarations(
				{ ...base, important: true },
				{ ...base, inline: true }
			)
		).toBeGreaterThan( 0 );
	} );

	it( 'lets unlayered rules beat layered ones', () => {
		expect(
			compareDeclarations(
				{ ...base, specificity: [ 0, 0, 1 ] },
				{ ...base, layered: true, specificity: [ 1, 0, 0 ] }
			)
		).toBeGreaterThan( 0 );
	} );

	it( 'falls back to source order', () => {
		expect(
			compareDeclarations( { ...base, order: 2 }, base )
		).toBeGreaterThan( 0 );
	} );
} );

describe( 'traceCascade', () => {
	it( 'orders the element’s own declarations, strongest first', () => {
		setUp(
			'p { color: red; } .note { color: blue; }',
			'<p class="note" style="font-size: 20px">Hi</p>'
		);
		const element = document.querySelector( 'p' );
		const { results } = traceCascade( element, [
			...byLonghand( 'color' ),
			...byLonghand( 'font-size' ),
		] );

		expect(
			results.color.declarations.map( ( { value, isInEffect } ) => [
				value,
				isInEffect,
			] )
		).toEqual( [
			[ 'blue', true ],
			[ 'red', false ],
		] );
		expect( results[ 'font-size' ].declarations[ 0 ] ).toMatchObject( {
			inline: true,
			value: '20px',
			isInEffect: true,
		} );
	} );

	it( 'follows inherited properties up to the nearest ancestor that sets them', () => {
		setUp(
			'body { color: black; } .group { color: red; }',
			'<div class="group"><p>Hi</p></div>'
		);
		const { results } = traceCascade( document.querySelector( 'p' ), [
			...byLonghand( 'color' ),
		] );

		expect( results.color.declarations ).toHaveLength( 0 );
		expect(
			results.color.inherited.map( ( { element, declarations } ) => [
				element.tagName,
				declarations[ 0 ].isInEffect,
			] )
		).toEqual( [
			[ 'DIV', true ],
			[ 'BODY', false ],
		] );
	} );

	it( 'does not follow properties that do not inherit', () => {
		setUp(
			'.group { background-color: red; }',
			'<div class="group"><p>Hi</p></div>'
		);
		const { results } = traceCascade( document.querySelector( 'p' ), [
			...byLonghand( 'background-color' ),
		] );

		expect( results[ 'background-color' ].inherited ).toHaveLength( 0 );
	} );
} );

describe( 'traceOtherProperties', () => {
	it( 'lists properties outside the known ones, strongest first', () => {
		setUp(
			'p { opacity: 0.5; color: red; } .note { opacity: 0.8; }',
			'<p class="note" style="--wp--custom: 1">Hi</p>'
		);
		const result = traceOtherProperties( document.querySelector( 'p' ), [
			'color',
		] );

		expect( result.map( ( { property } ) => property ) ).toEqual( [
			'opacity',
		] );
		expect(
			result[ 0 ].declarations.map( ( { value, isInEffect } ) => [
				value,
				isInEffect,
			] )
		).toEqual( [
			[ '0.8', true ],
			[ '0.5', false ],
		] );
	} );
} );
