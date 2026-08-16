import { render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { AdminBlockRenderer } from '../admin-block-renderer';
import { registerAdminBlock } from '../registry';

function Label( { label }: { label?: string } ) {
	return <span>{ label }</span>;
}

function Box( { children }: { children?: ReactNode } ) {
	return <div data-testid="box">{ children }</div>;
}

describe( 'AdminBlockRenderer', () => {
	it( 'renders a registered admin block from its parsed attributes', () => {
		registerAdminBlock( {
			name: 'test/echo',
			component: Label,
			attributes: { label: {} },
		} );

		render(
			<AdminBlockRenderer content='<!-- wp:test/echo {"label":"hello"} /-->' />
		);

		expect( screen.getByText( 'hello' ) ).toBeVisible();
	} );

	it( 'renders inner blocks for a container admin block', () => {
		registerAdminBlock( {
			name: 'test/box',
			component: Box,
			attributes: {},
			supportsInnerBlocks: true,
		} );
		registerAdminBlock( {
			name: 'test/leaf',
			component: Label,
			attributes: { label: {} },
		} );

		render(
			<AdminBlockRenderer
				content={
					'<!-- wp:test/box -->\n<!-- wp:test/leaf {"label":"inner"} /-->\n<!-- /wp:test/box -->'
				}
			/>
		);

		expect( screen.getByTestId( 'box' ) ).toHaveTextContent( 'inner' );
	} );

	it( 'renders nothing for an unregistered block with no renderBlocks', () => {
		const { container } = render(
			<AdminBlockRenderer content="<!-- wp:core/paragraph --><p>x</p><!-- /wp:core/paragraph -->" />
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'sends an unregistered block to the server as serialized markup', async () => {
		const renderBlocks = jest.fn().mockResolvedValue( '<p>x</p>' );

		render(
			<AdminBlockRenderer
				content="<!-- wp:core/paragraph --><p>x</p><!-- /wp:core/paragraph -->"
				renderBlocks={ renderBlocks }
			/>
		);

		await waitFor( () =>
			expect( renderBlocks ).toHaveBeenCalledWith(
				'<!-- wp:paragraph --><p>x</p><!-- /wp:paragraph -->',
				{}
			)
		);
	} );

	it( 'mixes admin blocks and server-rendered blocks, in order', async () => {
		registerAdminBlock( {
			name: 'test/first',
			component: Label,
			attributes: { label: {} },
		} );

		const { container } = render(
			<AdminBlockRenderer
				content={
					'<!-- wp:test/first {"label":"admin"} /-->\n' +
					'<!-- wp:core/paragraph --><p>server</p><!-- /wp:core/paragraph -->'
				}
				renderBlocks={ jest.fn().mockResolvedValue( '<p>server</p>' ) }
			/>
		);

		expect( await screen.findByText( 'server' ) ).toBeVisible();
		expect( container ).toHaveTextContent( /^adminserver$/ );
	} );
} );
