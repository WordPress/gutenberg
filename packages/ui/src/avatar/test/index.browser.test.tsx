import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { createRef } from '@wordpress/element';
import { globe } from '@wordpress/icons';
import { render } from 'vitest-browser-react';
import '@wordpress/theme/design-tokens.css';
import * as Avatar from '../index';
import { ThemeProvider } from '../../utils/theme-provider';
import { Icon } from '../../icon';

const sizes = [ 'xs', 'sm', 'md', 'lg', 'xl' ] as const;

async function renderGallery(
	shape: 'circle' | 'square',
	kind: 'person' | 'site'
) {
	await render(
		<ThemeProvider>
			{ sizes.map( ( size ) => (
				<Avatar.Root
					key={ size }
					size={ size }
					shape={ shape }
					role="img"
					aria-label={ `${ size } ${ kind }` }
				>
					<Avatar.Fallback>
						{ kind === 'site' ? (
							<Icon icon={ globe } role="presentation" />
						) : undefined }
					</Avatar.Fallback>
				</Avatar.Root>
			) ) }
		</ThemeProvider>
	);
}

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
	it.each( [ 'initials', 'person' ] )(
		'keeps %s readable across colors and contrast boundaries',
		async ( kind ) => {
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
						<Avatar.Root
							key={ color }
							color={ color }
							role="img"
							aria-label={ color }
						>
							{ kind === 'initials' ? (
								<Avatar.Initials name="Alex Morgan" />
							) : (
								<Avatar.Fallback />
							) }
						</Avatar.Root>
					) ) }
				</div>
			);
			for ( const color of colors ) {
				const avatar = screen.getByRole( 'img', { name: color } );
				const content =
					kind === 'initials'
						? within( avatar ).getByText( 'AM' )
						: within( avatar ).getByRole( 'presentation', {
								hidden: true,
							} );
				const fill =
					// eslint-disable-next-line testing-library/no-node-access -- The person icon inherits its fallback's background.
					kind === 'initials' ? content : content.parentElement!;
				const backgroundColor =
					getComputedStyle( fill ).backgroundColor;
				const background = luminance( backgroundColor );
				const foreground = luminance(
					getComputedStyle( content ).color
				);
				expect( foreground ).toBeGreaterThan( 0 );
				expect( foreground ).toBeLessThan( 1 );
				expect( backgroundColor ).not.toBe( 'rgba(0, 0, 0, 0)' );
				expect(
					( Math.max( background, foreground ) + 0.05 ) /
						( Math.min( background, foreground ) + 0.05 )
				).toBeGreaterThanOrEqual( kind === 'initials' ? 4.5 : 3 );
			}
		}
	);

	it.each( [
		[ '#00800080', [ 0, 128, 0, 255 ] ],
		[ 'transparent', [ 0, 0, 0, 255 ] ],
		[ 'color(display-p3 1 0 0)', [ 255, 0, 0, 255 ] ],
	] )( 'uses an opaque sRGB fallback for %s', async ( color, expected ) => {
		await render(
			<Avatar.Root color={ color }>
				<Avatar.Fallback>AM</Avatar.Fallback>
			</Avatar.Root>
		);
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
						<Avatar.Root ref={ avatarRef } aria-hidden="true">
							<Avatar.Fallback>AM</Avatar.Fallback>
						</Avatar.Root>
						<span>Alex Morgan</span>
					</div>
				</div>
				<Avatar.Root role="img" aria-label="Reference">
					<Avatar.Fallback>AM</Avatar.Fallback>
				</Avatar.Root>
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

	it.each( [ 'circle', 'square' ] as const )(
		'keeps the person head visible and centered with the torso cropped at the bottom with shape=%s',
		async ( shape ) => {
			await renderGallery( shape, 'person' );
			for ( const size of sizes ) {
				const avatar = screen.getByRole( 'img', {
					name: `${ size } person`,
				} );
				const icon = within( avatar ).getByRole( 'presentation', {
					hidden: true,
				} );
				// eslint-disable-next-line testing-library/no-node-access -- Decorative SVG shapes have no semantic queries; inspect their rendered geometry.
				const headShape = icon.querySelector( 'circle' )!;
				// eslint-disable-next-line testing-library/no-node-access -- Inspect the painted shoulders inside the frame.
				const torsoShape = icon.querySelector( 'path' )!;
				// eslint-disable-next-line testing-library/no-node-access -- The fallback is the SVG's clipping frame, inside Avatar's border.
				const clippingFrame = icon.parentElement!;
				const frame = clippingFrame.getBoundingClientRect();
				const head = headShape.getBoundingClientRect();
				const torso = torsoShape.getBoundingClientRect();
				const graphic = icon.getBoundingClientRect();
				const stroke =
					( parseFloat( getComputedStyle( icon ).strokeWidth ) *
						graphic.width ) /
					24;
				expect( head.top - stroke / 2 ).toBeGreaterThan( frame.top );
				expect( head.left - stroke / 2 ).toBeGreaterThan( frame.left );
				expect( head.right + stroke / 2 ).toBeLessThan( frame.right );
				expect( head.bottom + stroke / 2 ).toBeGreaterThanOrEqual(
					torso.top - stroke / 2
				);
				expect(
					Math.abs(
						head.left +
							head.width / 2 -
							frame.left -
							frame.width / 2
					)
				).toBeLessThan( 0.1 );
				expect( torso.left - stroke / 2 ).toBeGreaterThan( frame.left );
				expect( torso.right + stroke / 2 ).toBeLessThan( frame.right );
				expect(
					Math.abs(
						torso.left +
							torso.width / 2 -
							frame.left -
							frame.width / 2
					)
				).toBeLessThan( 0.1 );
				expect( torso.bottom ).toBeGreaterThan( frame.bottom );
				expect( getComputedStyle( clippingFrame ).overflow ).toBe(
					'hidden'
				);
			}
		}
	);

	it.each( [ 'circle', 'square' ] as const )(
		'fits custom fallback graphics at every size with shape=%s',
		async ( shape ) => {
			await renderGallery( shape, 'site' );
			for ( const size of sizes ) {
				const avatar = screen.getByRole( 'img', {
					name: `${ size } site`,
				} );
				const icon = within( avatar ).getByRole( 'presentation', {
					hidden: true,
				} );
				const frame = avatar.getBoundingClientRect();
				const graphic = icon.getBoundingClientRect();
				expect( graphic.width ).toBeGreaterThan( 0 );
				expect( graphic.width ).toBeLessThan( frame.width );
				expect( graphic.height ).toBeLessThan( frame.height );
				expect( graphic.left ).toBeGreaterThan( frame.left );
				expect( graphic.right ).toBeLessThan( frame.right );
				expect( graphic.top ).toBeGreaterThan( frame.top );
				expect( graphic.bottom ).toBeLessThan( frame.bottom );
			}
		}
	);
} );
