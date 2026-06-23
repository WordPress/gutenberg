/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

/**
 * Internal dependencies
 */
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

	it( 'renders nothing for a block with no registered admin component', () => {
		// The SSR fallback for unregistered blocks lands in step 10.
		const { container } = render(
			<AdminBlockRenderer content="<!-- wp:core/paragraph --><p>x</p><!-- /wp:core/paragraph -->" />
		);

		expect( container ).toBeEmptyDOMElement();
	} );
} );
