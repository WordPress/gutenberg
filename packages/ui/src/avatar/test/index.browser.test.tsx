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

describe( 'Avatar layout', () => {
	it.each( [ 'circle', 'square' ] as const )(
		'adds a colored ring without changing size or neutral fallbacks with shape=%s',
		async ( shape ) => {
			await render(
				<ThemeProvider>
					<div
						style={
							{
								'--avatar-ring-test': '#008000',
							} as React.CSSProperties
						}
					>
						<Avatar.Root
							shape={ shape }
							color="#008000"
							role="img"
							aria-label="Colored initials"
						>
							<Avatar.Initials name="Alex Morgan" />
						</Avatar.Root>
						<Avatar.Root
							shape={ shape }
							color="var(--avatar-ring-test)"
							role="img"
							aria-label="Colored person"
						>
							<Avatar.Fallback />
						</Avatar.Root>
						<Avatar.Root
							shape={ shape }
							role="img"
							aria-label="Neutral"
						>
							<Avatar.Fallback />
						</Avatar.Root>
					</div>
				</ThemeProvider>
			);
			const neutral = screen.getByRole( 'img', { name: 'Neutral' } );
			const reference = getComputedStyle( neutral );
			for ( const name of [ 'Colored initials', 'Colored person' ] ) {
				const avatar = screen.getByRole( 'img', { name } );
				const styles = getComputedStyle( avatar );
				const ring = getComputedStyle( avatar, '::after' );
				expect( avatar.getBoundingClientRect().width ).toBe( 32 );
				expect( avatar.getBoundingClientRect().height ).toBe( 32 );
				expect( styles.backgroundColor ).toBe(
					reference.backgroundColor
				);
				expect( styles.color ).toBe( reference.color );
				expect( ring.outlineStyle ).toBe( 'solid' );
				expect( ring.outlineWidth ).toBe(
					reference
						// eslint-disable-next-line @wordpress/no-unknown-ds-tokens -- Read the token to compare its computed width.
						.getPropertyValue( '--wpds-border-width-focus' )
						.trim()
				);
				expect( ring.outlineOffset ).toBe( ring.outlineWidth );
				expect( ring.outlineColor ).toBe( 'rgb(0, 128, 0)' );
			}
			const person = within(
				screen.getByRole( 'img', { name: 'Colored person' } )
			).getByRole( 'presentation', { hidden: true } );
			expect( getComputedStyle( person ).color ).toBe(
				getComputedStyle(
					within( neutral ).getByRole( 'presentation', {
						hidden: true,
					} )
				).color
			);
		}
	);

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
