import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { createRef } from '@wordpress/element';
import '@wordpress/theme/design-tokens.css';
import * as Drawer from '..';
import { ThemeProvider } from '../../utils/theme-provider';

/**
 * The four corner radii of an element, clockwise from the top-left.
 *
 * @param element The element to read.
 */
function getCornerRadii( element: Element ) {
	const style = getComputedStyle( element );
	return [
		style.borderTopLeftRadius,
		style.borderTopRightRadius,
		style.borderBottomRightRadius,
		style.borderBottomLeftRadius,
	];
}

describe( 'Drawer.Content corners', () => {
	it.each( [ 'left', 'right', 'up', 'down' ] as const )(
		'follows the rounded corners of the %s drawer',
		async ( swipeDirection ) => {
			const contentRef = createRef< HTMLDivElement >();

			await render(
				<ThemeProvider isRoot>
					<Drawer.Root defaultOpen swipeDirection={ swipeDirection }>
						<Drawer.Popup>
							<Drawer.Title>Menu</Drawer.Title>
							<Drawer.Content ref={ contentRef }>
								<p>Body</p>
							</Drawer.Content>
						</Drawer.Popup>
					</Drawer.Root>
				</ThemeProvider>
			);

			const popup = await screen.findByRole( 'dialog', { name: 'Menu' } );
			await waitFor( () => {
				expect( contentRef.current ).toBeInstanceOf( HTMLDivElement );
			} );

			// A drawer rounds only the two corners away from its anchored edge.
			const popupRadii = getCornerRadii( popup );
			expect(
				popupRadii.filter( ( radius ) => radius !== '0px' )
			).toHaveLength( 2 );

			expect( getCornerRadii( contentRef.current! ) ).toEqual(
				popupRadii
			);
		}
	);
} );
