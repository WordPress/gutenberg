import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { createRef } from '@wordpress/element';
import { globe } from '@wordpress/icons';
import { render } from 'vitest-browser-react';
import '@wordpress/theme/design-tokens.css';
import * as Avatar from '../index';
import { ThemeProvider } from '../../utils/theme-provider';
import { Icon } from '../../icon';

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
		'fits default and custom fallback graphics at every size with shape=%s',
		async ( shape ) => {
			await render(
				<ThemeProvider>
					{ ( [ 'xs', 'sm', 'md', 'lg', 'xl' ] as const ).map(
						( size ) => (
							<div key={ size }>
								<Avatar.Root
									size={ size }
									shape={ shape }
									role="img"
									aria-label={ `${ size } person` }
								>
									<Avatar.Fallback />
								</Avatar.Root>
								<Avatar.Root
									size={ size }
									shape={ shape }
									role="img"
									aria-label={ `${ size } site` }
								>
									<Avatar.Fallback>
										<Icon
											icon={ globe }
											role="presentation"
										/>
									</Avatar.Fallback>
								</Avatar.Root>
							</div>
						)
					) }
				</ThemeProvider>
			);
			for ( const size of [ 'xs', 'sm', 'md', 'lg', 'xl' ] ) {
				for ( const kind of [ 'person', 'site' ] ) {
					const avatar = screen.getByRole( 'img', {
						name: `${ size } ${ kind }`,
					} );
					const icon = within( avatar ).getByRole( 'presentation', {
						hidden: true,
					} );
					expect( icon ).toBeInTheDocument();
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
		}
	);
} );
