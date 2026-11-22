import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { createRef } from '@wordpress/element';
import '@wordpress/theme/design-tokens.css';
import * as Dialog from '..';
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

describe( 'Dialog.Content corners', () => {
	it.each( [
		{ pinHeader: true, pinFooter: true, rounded: [] },
		{ pinHeader: true, pinFooter: false, rounded: [ 2, 3 ] },
		{ pinHeader: false, pinFooter: true, rounded: [ 0, 1 ] },
		{ pinHeader: false, pinFooter: false, rounded: [ 0, 1, 2, 3 ] },
	] )(
		'follows the popup corners it meets (pinned header: $pinHeader, pinned footer: $pinFooter)',
		async ( { pinHeader, pinFooter, rounded } ) => {
			const contentRef = createRef< HTMLDivElement >();
			const header = (
				<Dialog.Header>
					<Dialog.Title>Terms</Dialog.Title>
					<Dialog.CloseIconButton />
				</Dialog.Header>
			);
			const footer = (
				<Dialog.Footer>
					<Dialog.Action>Accept</Dialog.Action>
				</Dialog.Footer>
			);

			await render(
				<ThemeProvider isRoot>
					<Dialog.Root defaultOpen>
						<Dialog.Popup>
							{ pinHeader && header }
							<Dialog.Content ref={ contentRef }>
								{ ! pinHeader && header }
								<p>Body</p>
								{ ! pinFooter && footer }
							</Dialog.Content>
							{ pinFooter && footer }
						</Dialog.Popup>
					</Dialog.Root>
				</ThemeProvider>
			);

			const popup = await screen.findByRole( 'dialog', {
				name: 'Terms',
			} );
			await waitFor( () => {
				expect( contentRef.current ).toBeInstanceOf( HTMLDivElement );
			} );

			const popupRadius = getCornerRadii( popup )[ 0 ];
			// Guard against a missing token, which would make every radius zero.
			expect( popupRadius ).not.toBe( '0px' );

			// A corner follows the popup where the scroll area touches it, and
			// stays square where the scroll area ends above pinned chrome.
			expect( getCornerRadii( contentRef.current! ) ).toEqual(
				[ 0, 1, 2, 3 ].map( ( corner ) =>
					rounded.includes( corner ) ? popupRadius : '0px'
				)
			);
		}
	);
} );
