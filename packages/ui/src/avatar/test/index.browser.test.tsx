import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { createRef } from '@wordpress/element';
import { render } from 'vitest-browser-react';
import '@wordpress/theme/design-tokens.css';
import { Avatar } from '../index';
import { ThemeProvider } from '../../utils/theme-provider';

function luminance( color: string ) {
	const channels = color
		.match( /[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi )!
		.map( Number );
	const linear = color.startsWith( 'color(srgb-linear' )
		? channels
		: channels.map( ( channel ) => {
				const value = color.startsWith( 'color(' )
					? channel
					: channel / 255;
				return value <= 0.04045
					? value / 12.92
					: ( ( value + 0.055 ) / 1.055 ) ** 2.4;
			} );
	return linear[ 0 ] * 0.2126 + linear[ 1 ] * 0.7152 + linear[ 2 ] * 0.0722;
}

describe( 'Avatar colors', () => {
	it( 'keeps initials readable across colors and contrast boundaries', async () => {
		const crossover = ( Math.sqrt( 21 ) - 1 ) / 20;
		const colors = [
			'#00e050',
			'#064e3b',
			'#6f42c1',
			'#d94145',
			'#fbbf24',
			'#ff35ee',
			'#879f11',
			'#0f766e',
			'#00cfff',
			'#757575',
			'#767676',
			'#777777',
			'#999999',
			'#000000',
			'#ffffff',
			'#00800080',
			'transparent',
			'hsl(200 100% 50%)',
			'var(--avatar-test-color)',
			'var(--avatar-missing-color, #3858e9)',
			'color(display-p3 1 0 0)',
			// The 4.5:1 limits and the point where black and white have equal contrast.
			...[
				0.175,
				crossover - 0.000001,
				crossover,
				crossover + 0.000001,
				1.05 / 4.5 - 0.05,
			].flatMap( ( background ) => [
				`color(srgb-linear ${ background } ${ background } ${ background })`,
				`color(srgb-linear ${ background / 0.2126 } 0 0)`,
				`color(srgb-linear 0 ${ background / 0.7152 } 0)`,
				`color(srgb-linear 0.25 ${
					( background - 0.2126 * 0.25 - 0.0722 ) / 0.7152
				} 1)`,
			] ),
		];
		await render(
			<div
				style={
					{
						'--avatar-test-color': '#f3d1ab',
					} as React.CSSProperties
				}
			>
				{ colors.map( ( color ) => (
					<Avatar
						name="Alex Morgan"
						key={ color }
						color={ color }
						aria-label={ color }
					/>
				) ) }
			</div>
		);
		for ( const color of colors ) {
			const avatar = screen.getByRole( 'img', { name: color } );
			const content = within( avatar ).getByText( 'AM' );
			const backgroundColor = getComputedStyle( content ).backgroundColor;
			const background = luminance( backgroundColor );
			const foreground = luminance( getComputedStyle( content ).color );
			expect( foreground ).toBeGreaterThan( 0 );
			expect( foreground ).toBeLessThan( 1 );
			expect( backgroundColor ).not.toBe( 'rgba(0, 0, 0, 0)' );
			expect(
				( Math.max( background, foreground ) + 0.05 ) /
					( Math.min( background, foreground ) + 0.05 )
			).toBeGreaterThanOrEqual( 4.5 );
		}
	} );

	it.each( [
		[ '#00800080', [ 0, 128, 0, 255 ] ],
		[ 'transparent', [ 0, 0, 0, 255 ] ],
		[ 'color(display-p3 1 0 0)', [ 255, 0, 0, 255 ] ],
	] )( 'uses an opaque sRGB fallback for %s', async ( color, expected ) => {
		await render( <Avatar name="Alex Morgan" color={ color } /> );
		const context = document.createElement( 'canvas' ).getContext( '2d' )!;
		context.fillStyle = getComputedStyle(
			screen.getByText( 'AM' )
		).backgroundColor;
		context.fillRect( 0, 0, 1, 1 );
		expect( Array.from( context.getImageData( 0, 0, 1, 1 ).data ) ).toEqual(
			expected
		);
	} );
} );

describe( 'Avatar layout', () => {
	it( 'keeps decorative avatars in flow with their typography inside wp-admin trees', async () => {
		const avatarRef = createRef< HTMLSpanElement >();
		await render(
			<ThemeProvider>
				<style>
					{
						'[role="treeitem"] span[aria-hidden] { display: inline; font-family: dashicons; font-size: 20px; line-height: 1; position: absolute; pointer-events: none; }'
					}
				</style>
				<div role="tree">
					<div role="treeitem">
						<Avatar
							name="Alex Morgan"
							ref={ avatarRef }
							aria-hidden="true"
						/>
						<span>Alex Morgan</span>
					</div>
				</div>
				<Avatar name="Alex Morgan" role="img" aria-label="Reference" />
			</ThemeProvider>
		);
		const avatar = avatarRef.current!;
		const styles = getComputedStyle( avatar );
		const reference = getComputedStyle(
			screen.getByRole( 'img', { name: 'Reference' } )
		);
		expect( styles.position ).toBe( 'relative' );
		expect( styles.display ).toBe( 'inline-flex' );
		expect( styles.fontFamily ).toBe( reference.fontFamily );
		expect( styles.fontSize ).toBe( reference.fontSize );
		expect( styles.pointerEvents ).toBe( reference.pointerEvents );
	} );
} );
