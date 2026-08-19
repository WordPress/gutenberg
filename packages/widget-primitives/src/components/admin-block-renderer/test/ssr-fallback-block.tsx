import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { SsrFallbackBlock } from '../ssr-fallback-block';

const MARKUP = '<!-- wp:paragraph --><p>Hi</p><!-- /wp:paragraph -->';

describe( 'SsrFallbackBlock', () => {
	it( 'renders nothing when the caller supplies no renderBlocks', () => {
		const { container } = render(
			<SsrFallbackBlock markup={ MARKUP } attributes={ {} } />
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'injects the resolved HTML', async () => {
		const renderBlocks = jest.fn().mockResolvedValue( '<p>Hi</p>' );

		render(
			<SsrFallbackBlock
				markup={ MARKUP }
				attributes={ {} }
				renderBlocks={ renderBlocks }
			/>
		);

		expect( await screen.findByText( 'Hi' ) ).toBeVisible();
	} );

	it( 'forwards the markup and the instance attributes', async () => {
		const renderBlocks = jest.fn().mockResolvedValue( '' );
		const attributes = { name: 'Ada' };

		render(
			<SsrFallbackBlock
				markup={ MARKUP }
				attributes={ attributes }
				renderBlocks={ renderBlocks }
			/>
		);

		await waitFor( () =>
			expect( renderBlocks ).toHaveBeenCalledWith( MARKUP, attributes )
		);
	} );

	it( 'reports a failed resolution without leaking why', async () => {
		const renderBlocks = jest
			.fn()
			.mockRejectedValue( new Error( 'HTTP 500' ) );

		render(
			<SsrFallbackBlock
				markup={ MARKUP }
				attributes={ {} }
				renderBlocks={ renderBlocks }
			/>
		);

		const alert = await screen.findByRole( 'alert' );

		expect( alert ).toBeVisible();
		expect( alert ).not.toHaveTextContent( 'HTTP 500' );
	} );
} );
