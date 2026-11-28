import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getLayoutStyles } from '@wordpress/global-styles-engine';
import '../style.scss';

let layoutStyles: HTMLStyleElement;
let themeStyles: HTMLStyleElement | undefined;
let fixture: HTMLDivElement;

function createFixture( {
	className = 'entry-content wp-block-post-content is-layout-constrained',
	direction = 'ltr',
	width = 800,
	nested = false,
} = {} ) {
	fixture = document.createElement( 'div' );
	fixture.className = className;
	fixture.dir = direction;
	fixture.style.width = `${ width }px`;
	fixture.style.setProperty( '--wp--style--global--content-size', '400px' );
	const paragraph = document.createElement( 'p' );
	paragraph.textContent = 'Post content before the More block.';
	const link = document.createElement( 'a' );
	link.className = 'more-link';
	link.href = '#more-123';
	link.textContent = 'Continue reading';
	fixture.appendChild( paragraph );
	( nested ? paragraph : fixture ).appendChild( link );
	document.body.appendChild( fixture );
	return { paragraph, link };
}

beforeEach( () => {
	// Use the same generated layout rules as Global Styles, not copied CSS.
	layoutStyles = document.createElement( 'style' );
	layoutStyles.textContent = getLayoutStyles( { selector: 'body' } );
	document.head.appendChild( layoutStyles );
} );

afterEach( () => {
	fixture.remove();
	layoutStyles.remove();
	themeStyles?.remove();
	themeStyles = undefined;
} );

describe( 'Post Content More link styles', () => {
	it.each( [
		[ 'ltr', 800 ],
		[ 'rtl', 800 ],
		[ 'ltr', 320 ],
		[ 'rtl', 320 ],
	] as const )(
		'aligns the More link with constrained content in %s at %ipx',
		( direction, width ) => {
			const { paragraph, link } = createFixture( { direction, width } );
			const paragraphRect = paragraph.getBoundingClientRect();
			const linkRect = link.getBoundingClientRect();
			expect( paragraphRect.width ).toBe( Math.min( width, 400 ) );
			expect( linkRect.left ).toBeCloseTo( paragraphRect.left, 4 );
			expect( linkRect.right ).toBeCloseTo( paragraphRect.right, 4 );
			expect( getComputedStyle( link ).display ).toBe( 'block' );
		}
	);

	it.each( [
		'entry-content is-layout-constrained',
		'entry-content wp-block-post-content is-layout-flow',
	] )( 'keeps More links inline in %s', ( className ) => {
		const { link } = createFixture( { className } );
		expect( getComputedStyle( link ).display ).toBe( 'inline' );
	} );

	it( 'keeps a More link inside a paragraph inline', () => {
		const { link } = createFixture( { nested: true } );
		expect( getComputedStyle( link ).display ).toBe( 'inline' );
	} );

	it( 'allows themes to override the More link display', () => {
		const { link } = createFixture();
		themeStyles = document.createElement( 'style' );
		themeStyles.textContent = 'a { display: inline-block; }';
		document.head.appendChild( themeStyles );
		expect( getComputedStyle( link ).display ).toBe( 'inline-block' );
	} );
} );
