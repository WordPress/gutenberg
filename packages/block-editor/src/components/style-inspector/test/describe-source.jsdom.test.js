import { beforeEach, describe, expect, it } from 'vitest';
import { describeDeclaration, getPresetLabel } from '../describe-source';

// jsdom does not set `CSSStyleSheet.ownerNode`, which browsers always do.
function sheetWithOrigin( origin ) {
	const style = document.createElement( 'style' );
	style.dataset.styleOrigin = origin;
	return { ownerNode: style };
}

describe( 'describeDeclaration', () => {
	let block;
	let context;

	beforeEach( () => {
		document.body.innerHTML =
			'<div data-block="parent" class="wp-block-group"><p data-block="child" class="has-accent-color">Hi</p></div>';
		block = document.querySelector( 'p' );
		context = {
			owner: block,
			inspected: block,
			getBlockTitle: ( id ) =>
				id === 'parent' ? 'Group' : 'Paragraph',
			getTypeTitle: ( slug ) =>
				( { paragraph: 'Paragraph', button: 'Button' } )[ slug ],
			getStyleLabel: ( name ) => ( { subtitle: 'Subtitle' } )[ name ],
		};
	} );

	it( 'names inline styles on the inspected block', () => {
		expect( describeDeclaration( { inline: true }, context ).label ).toBe(
			'Customized here'
		);
	} );

	it( 'names inline styles on a parent block', () => {
		expect(
			describeDeclaration(
				{ inline: true },
				{ ...context, owner: document.querySelector( 'div' ) }
			).label
		).toBe( 'Group block' );
	} );

	it( 'treats a preset class the block carries as set on the block', () => {
		expect(
			describeDeclaration(
				{
					selectorText: '.has-accent-color',
					sheet: sheetWithOrigin( 'global-styles' ),
				},
				context
			).label
		).toBe( 'Customized here' );
	} );

	it.each( [
		[ ':root :where(.wp-block-paragraph)', 'Site styles · Paragraph' ],
		[
			':root :where(.wp-block-button .wp-block-button__link)',
			'Site styles · Button',
		],
		[ '.is-style-subtitle--2', '“Subtitle” style' ],
		[ 'h2', 'Site styles · H2 headings' ],
		[ 'body', 'Site styles' ],
	] )( 'describes the Global Styles selector %s', ( selectorText, label ) => {
		expect(
			describeDeclaration(
				{ selectorText, sheet: sheetWithOrigin( 'global-styles' ) },
				context
			).label
		).toBe( label );
	} );
} );

describe( 'getPresetLabel', () => {
	const getPresetName = ( type, slug ) =>
		( { 'color|accent-4': 'Accent 4' } )[ `${ type }|${ slug }` ];

	it( 'reads CSS custom property references', () => {
		expect(
			getPresetLabel(
				'var(--wp--preset--color--accent-4)',
				getPresetName
			)
		).toBe( 'Accent 4' );
	} );

	it( 'reads theme.json references and title-cases unknown slugs', () => {
		expect(
			getPresetLabel( 'var:preset|font-size|x-large', getPresetName )
		).toBe( 'X Large' );
	} );

	it( 'ignores plain values', () => {
		expect( getPresetLabel( '1.75rem', getPresetName ) ).toBeNull();
	} );
} );
