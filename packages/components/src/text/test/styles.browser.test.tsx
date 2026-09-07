import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { Text } from '../';
import { Heading } from '../../heading';
import { PaletteHeading } from '../../palette-edit/styles';
import { NavigatorHeading } from '../../date-time/date-picker/styles';
import type { Props } from '../types';

beforeEach( () => {
	// The production build supplies token fallbacks; source CSS uses the theme.
	document.documentElement.style.setProperty(
		'--wp-components-color-gray-700',
		'#707070'
	);
} );

afterEach( () => {
	cleanup();
	document.documentElement.style.removeProperty(
		'--wp-components-color-gray-700'
	);
} );

describe( 'Text styles', () => {
	it.each< [ string, Partial< Props >, Partial< CSSStyleDeclaration > ] >( [
		[
			'readability color',
			{ optimizeReadabilityFor: 'blue' },
			{ color: 'rgb(255, 255, 255)' },
		],
		[ 'preset size', { size: 'title' }, { fontSize: '20px' } ],
		[ 'custom size', { size: 15 }, { fontSize: '15px' } ],
		[
			'muted variant',
			{ variant: 'muted' },
			{ color: 'rgb(112, 112, 112)' },
		],
		[ 'alignment', { align: 'center' }, { textAlign: 'center' } ],
		[ 'color', { color: 'orange' }, { color: 'rgb(255, 165, 0)' } ],
		[
			'destructive color',
			{ isDestructive: true },
			{ color: 'rgb(217, 79, 79)' },
		],
		[ 'display', { display: 'inline-flex' }, { display: 'inline-flex' } ],
		[ 'block display', { isBlock: true }, { display: 'block' } ],
		[ 'line height', { lineHeight: 1.5 }, { lineHeight: '19.5px' } ],
		[ 'uppercase', { upperCase: true }, { textTransform: 'uppercase' } ],
		[ 'weight', { weight: 700 }, { fontWeight: '700' } ],
		[ 'truncation', { truncate: true }, { whiteSpace: 'nowrap' } ],
		[
			'block display with line clamping',
			{ truncate: true, numberOfLines: 2, isBlock: true },
			{ display: 'block' },
		],
	] )( 'renders %s', ( _name, props, expected ) => {
		render(
			<Text role="note" { ...props }>
				Example
			</Text>
		);
		const computed = getComputedStyle( screen.getByRole( 'note' ) );
		for ( const [ property, value ] of Object.entries( expected ) ) {
			expect( computed[ property as keyof CSSStyleDeclaration ] ).toBe(
				value
			);
		}
	} );

	it( 'keeps variant color after earlier instances and explicit colors', () => {
		render(
			<>
				<Text variant="muted">Earlier instance</Text>
				<Text
					role="note"
					color="orange"
					optimizeReadabilityFor="blue"
					isDestructive
					variant="muted"
				>
					Example
				</Text>
			</>
		);
		expect( getComputedStyle( screen.getByRole( 'note' ) ).color ).toBe(
			'rgb(112, 112, 112)'
		);
	} );

	it( 'keeps block display ahead of the explicit display prop', () => {
		render(
			<Text role="note" display="inline-flex" isBlock>
				Example
			</Text>
		);
		expect( getComputedStyle( screen.getByRole( 'note' ) ).display ).toBe(
			'block'
		);
	} );

	it( 'preserves inherited typography values', () => {
		render(
			<div
				style={ {
					color: 'purple',
					fontSize: 30,
					fontWeight: 800,
					lineHeight: '40px',
					letterSpacing: 4,
					textAlign: 'right',
					display: 'flex',
				} }
			>
				<Text
					role="note"
					color="inherit"
					size="inherit"
					weight="inherit"
					lineHeight="inherit"
					letterSpacing="inherit"
					align="inherit"
					display="inherit"
				>
					Example
				</Text>
			</div>
		);
		const computed = getComputedStyle( screen.getByRole( 'note' ) );
		expect( computed.color ).toBe( 'rgb(128, 0, 128)' );
		expect( computed.fontSize ).toBe( '30px' );
		expect( computed.fontWeight ).toBe( '800' );
		expect( computed.lineHeight ).toBe( '40px' );
		expect( computed.letterSpacing ).toBe( '4px' );
		expect( computed.textAlign ).toBe( 'right' );
		expect( computed.display ).toBe( 'flex' );
	} );

	it( 'keeps nested instances independent and allows inline overrides', () => {
		render(
			<Text size={ 30 } isDestructive upperCase>
				<Text role="note" style={ { color: 'blue', fontSize: 17 } }>
					Child
				</Text>
			</Text>
		);
		const computed = getComputedStyle( screen.getByRole( 'note' ) );
		expect( computed.color ).toBe( 'rgb(0, 0, 255)' );
		expect( computed.fontSize ).toBe( '17px' );
		expect( computed.fontWeight ).toBe( '400' );
		expect( computed.lineHeight ).toBe( '23.8px' );
		// Text transformation is intentionally inherited through normal CSS.
		expect( computed.textTransform ).toBe( 'uppercase' );
	} );

	it( 'retains Heading typography and the supported heading element', () => {
		render( <Heading level={ 3 }>Section</Heading> );
		const heading = screen.getByRole( 'heading', { level: 3 } );
		const computed = getComputedStyle( heading );
		expect( heading.tagName ).toBe( 'H3' );
		expect( computed.fontSize ).toBe( '20.28px' );
		expect( computed.fontWeight ).toBe( '600' );
		expect( computed.display ).toBe( 'block' );
	} );

	it.each( [ 4, '4' ] as const )(
		'renders Heading level %s with the corresponding typography',
		( level ) => {
			render(
				<>
					<Heading>Default section</Heading>
					<Heading level={ level }>Nested section</Heading>
				</>
			);
			expect(
				getComputedStyle( screen.getByRole( 'heading', { level: 2 } ) )
					.fontSize
			).toBe( '25.35px' );
			expect(
				getComputedStyle( screen.getByRole( 'heading', { level: 4 } ) )
					.fontSize
			).toBe( '16.25px' );
		}
	);

	it( 'preserves PaletteHeading typography', () => {
		render( <PaletteHeading>Palette name</PaletteHeading> );
		const computed = getComputedStyle( screen.getByRole( 'heading' ) );
		expect( computed.fontSize ).toBe( '11px' );
		expect( computed.lineHeight ).toBe( '24px' );
		expect( computed.fontWeight ).toBe( '600' );
	} );

	it( 'preserves DatePicker month heading typography', () => {
		render(
			<NavigatorHeading level={ 3 }>
				<strong>January</strong> 2026
			</NavigatorHeading>
		);
		const computed = getComputedStyle( screen.getByRole( 'heading' ) );
		expect( computed.fontSize ).toBe( '13px' );
		expect( computed.fontWeight ).toBe( '400' );
		expect( computed.lineHeight ).toBe( '18.2px' );
	} );
} );
