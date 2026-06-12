// These tests intentionally assert on the non-semantic DOM that the provider
// produces — the injected `<style>` element and the `data-*` scoping attributes
// — which have no accessible role to query through Testing Library.
/* eslint-disable testing-library/no-container, testing-library/no-node-access */

import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../theme-provider';

// The global Jest setup maps CSS modules to an empty object, which would leave
// the provider's scoping class `undefined`. Provide a real class name so the
// generated selectors and the wrapper's class can be asserted meaningfully.
jest.mock( '../style.module.css', () => ( {
	root: 'theme-provider-root',
} ) );

function getProvider( container: HTMLElement ) {
	return container.querySelector< HTMLElement >(
		'[data-wpds-theme-provider-id]'
	);
}

function getStyleText( container: HTMLElement ) {
	return container.querySelector( 'style' )?.textContent ?? '';
}

describe( 'ThemeProvider', () => {
	it( 'renders its children', () => {
		render( <ThemeProvider>content</ThemeProvider> );

		expect( screen.getByText( 'content' ) ).toBeInTheDocument();
	} );

	it( 'renders a wrapper element with the provider metadata attributes', () => {
		const { container } = render( <ThemeProvider>x</ThemeProvider> );
		const provider = getProvider( container );

		expect( provider ).toHaveClass( 'theme-provider-root' );
		expect( provider ).toHaveAttribute( 'data-wpds-theme-provider-id' );
		expect( provider ).toHaveAttribute(
			'data-wpds-root-provider',
			'false'
		);
	} );

	it( 'generates a unique instance id for each provider', () => {
		const { container } = render(
			<>
				<ThemeProvider>a</ThemeProvider>
				<ThemeProvider>b</ThemeProvider>
			</>
		);

		const ids = Array.from(
			container.querySelectorAll( '[data-wpds-theme-provider-id]' )
		).map( ( el ) => el.getAttribute( 'data-wpds-theme-provider-id' ) );

		expect( ids ).toHaveLength( 2 );
		expect( ids[ 0 ] ).toBeTruthy();
		expect( ids[ 0 ] ).not.toBe( ids[ 1 ] );
	} );

	describe( 'style element', () => {
		it( 'scopes the custom properties to the provider instance id', () => {
			const { container } = render(
				<ThemeProvider color={ { primary: '#ff0000' } }>
					x
				</ThemeProvider>
			);
			const instanceId = getProvider( container )?.getAttribute(
				'data-wpds-theme-provider-id'
			);
			const styleText = getStyleText( container );

			// The instance selector scopes to both the provider's class (with
			// the intentional doubled specificity) and its unique instance id.
			expect( styleText ).toContain(
				`.theme-provider-root.theme-provider-root[data-wpds-theme-provider-id="${ instanceId }"]`
			);
			// The generated declarations include the color tokens.
			expect( styleText ).toContain( '--wp-admin-theme-color' );
		} );

		it( 'sets the cursor control custom property when requested', () => {
			const { container } = render(
				<ThemeProvider cursor={ { control: 'pointer' } }>
					x
				</ThemeProvider>
			);

			expect( getStyleText( container ) ).toContain(
				'--wpds-cursor-control: pointer'
			);
		} );
	} );

	describe( 'isRoot selector', () => {
		it( 'does not target the document root by default', () => {
			const { container } = render(
				<ThemeProvider color={ { primary: '#ff0000' } }>
					x
				</ThemeProvider>
			);

			expect( getProvider( container ) ).toHaveAttribute(
				'data-wpds-root-provider',
				'false'
			);
			expect( getStyleText( container ) ).not.toContain( ':root:has(' );
		} );

		it( 'targets the document root when isRoot is set', () => {
			const { container } = render(
				<ThemeProvider isRoot color={ { primary: '#ff0000' } }>
					x
				</ThemeProvider>
			);

			expect( getProvider( container ) ).toHaveAttribute(
				'data-wpds-root-provider',
				'true'
			);
			const instanceId = getProvider( container )?.getAttribute(
				'data-wpds-theme-provider-id'
			);
			// The document root is targeted via `:has()`, matching the
			// provider's class, the root flag, and its unique instance id.
			expect( getStyleText( container ) ).toContain(
				`:root:has(.theme-provider-root[data-wpds-root-provider="true"][data-wpds-theme-provider-id="${ instanceId }"])`
			);
		} );
	} );

	describe( 'nested providers', () => {
		it( 'renders a distinct scope and style for each provider', () => {
			const { container } = render(
				<ThemeProvider color={ { primary: '#ff0000' } }>
					<ThemeProvider color={ { primary: '#00ff00' } }>
						nested
					</ThemeProvider>
				</ThemeProvider>
			);

			expect(
				container.querySelectorAll( '[data-wpds-theme-provider-id]' )
			).toHaveLength( 2 );
			expect( container.querySelectorAll( 'style' ) ).toHaveLength( 2 );
			expect( screen.getByText( 'nested' ) ).toBeInTheDocument();
		} );
	} );
} );

/* eslint-enable testing-library/no-container, testing-library/no-node-access */
