import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { createPortal } from '@wordpress/element';
import { Item, ItemGroup } from '..';

describe( 'ItemGroup', () => {
	it( 'accepts an Item nested within a semantic list', async () => {
		await render(
			<ItemGroup>
				<div>
					<Item>Nested item</Item>
				</div>
			</ItemGroup>
		);

		expect( screen.getByRole( 'listitem' ) ).toHaveTextContent(
			'Nested item'
		);
	} );

	it( 'throws when an Item with list semantics is outside a semantic list', async () => {
		const portalContainer = document.createElement( 'div' );
		document.body.append( portalContainer );

		try {
			await expect(
				render(
					<ItemGroup>
						{ createPortal(
							<Item>Portaled item</Item>,
							portalContainer
						) }
					</ItemGroup>
				)
			).rejects.toThrow(
				'Item with list semantics must be rendered inside an element with role="list".'
			);
			expect( console ).toHaveErrored();
		} finally {
			portalContainer.remove();
		}
	} );

	it( 'accepts custom children', async () => {
		await render(
			<ItemGroup>
				<div>Custom item</div>
			</ItemGroup>
		);

		expect( screen.getByText( 'Custom item' ) ).toBeVisible();
	} );

	it( 'preserves custom roles', async () => {
		await render(
			<ItemGroup role="group">
				<div>
					<Item role="presentation">Custom item</Item>
				</div>
			</ItemGroup>
		);

		expect( screen.getByRole( 'group' ) ).toBeVisible();
	} );

	it( 'renders its items', async () => {
		await render(
			<ItemGroup data-testid="group">
				<Item>Code is poetry</Item>
			</ItemGroup>
		);

		expect( screen.getByTestId( 'group' ) ).toHaveTextContent(
			'Code is poetry'
		);
		expect( screen.getByTestId( 'group' ) ).toHaveClass(
			'components-item-group'
		);
		expect( screen.getByText( 'Code is poetry' ) ).toHaveClass(
			'components-item'
		);
	} );

	it( 'shows borders when isBordered is true', async () => {
		await render(
			<ItemGroup data-testid="plain">
				<Item>Plain</Item>
			</ItemGroup>
		);
		await render(
			<ItemGroup data-testid="bordered" isBordered>
				<Item>Bordered</Item>
			</ItemGroup>
		);

		expect(
			window.getComputedStyle( screen.getByTestId( 'plain' ) )
				.borderTopWidth
		).toBe( '0px' );
		expect(
			window.getComputedStyle( screen.getByTestId( 'bordered' ) )
				.borderTopWidth
		).toBe( '1px' );
	} );

	it( 'shows rounded corners when isRounded is true', async () => {
		/* eslint-disable @wordpress/no-setting-ds-tokens -- This fixture supplies the design token consumed by ItemGroup. */
		await render(
			<ItemGroup
				data-testid="rounded"
				style={ { '--wpds-border-radius-sm': '4px' } }
			>
				<Item>Rounded</Item>
			</ItemGroup>
		);
		/* eslint-enable @wordpress/no-setting-ds-tokens */
		await render(
			<ItemGroup data-testid="squared" isRounded={ false }>
				<Item>Squared</Item>
			</ItemGroup>
		);

		expect(
			window.getComputedStyle( screen.getByTestId( 'rounded' ) )
				.borderTopLeftRadius
		).not.toBe(
			window.getComputedStyle( screen.getByTestId( 'squared' ) )
				.borderTopLeftRadius
		);
	} );

	it( 'separates items when isSeparated is true', async () => {
		await render(
			<ItemGroup>
				<Item data-testid="grouped-item">Grouped</Item>
			</ItemGroup>
		);
		await render(
			<ItemGroup isSeparated>
				<Item data-testid="separated-item">Separated</Item>
				<Item>Last</Item>
			</ItemGroup>
		);

		expect(
			window.getComputedStyle( screen.getByTestId( 'grouped-item' ) )
				.borderBottomWidth
		).toBe( '0px' );
		expect(
			window.getComputedStyle( screen.getByTestId( 'separated-item' ) )
				.borderBottomWidth
		).toBe( '1px' );
	} );

	describe( 'Item', () => {
		it( 'uses list semantics only within a list-semantic ItemGroup', async () => {
			const { rerender } = await render( <Item>Standalone item</Item> );

			expect( screen.queryByRole( 'listitem' ) ).not.toBeInTheDocument();

			await rerender(
				<ItemGroup role="group">
					<Item>Non-list item</Item>
				</ItemGroup>
			);

			expect( screen.queryByRole( 'listitem' ) ).not.toBeInTheDocument();

			await rerender(
				<ItemGroup>
					<Item>Grouped item</Item>
				</ItemGroup>
			);

			expect( screen.getByRole( 'listitem' ) ).toHaveTextContent(
				'Grouped item'
			);
		} );

		it( 'uses list semantics within an ItemGroup with the directory role', async () => {
			await render(
				<ItemGroup role="directory">
					<Item>Directory item</Item>
				</ItemGroup>
			);

			expect( screen.getByRole( 'listitem' ) ).toHaveTextContent(
				'Directory item'
			);
		} );

		it( 'renders as a button when onClick is specified', async () => {
			const user = userEvent.setup();
			const onClick = vi.fn();
			await render( <Item onClick={ onClick }>Code is poetry</Item> );

			await user.click( screen.getByRole( 'button' ) );

			expect( onClick ).toHaveBeenCalledOnce();
		} );

		it( 'gives priority to the as prop over onClick', async () => {
			const onClick = vi.fn();
			const { rerender } = await render(
				<Item onClick={ onClick }>Code is poetry</Item>
			);

			expect( screen.getByRole( 'button' ) ).toBeInTheDocument();

			await rerender(
				<Item as="a" href="#" onClick={ onClick }>
					Code is poetry
				</Item>
			);

			expect( screen.queryByRole( 'button' ) ).not.toBeInTheDocument();
			expect( screen.getByRole( 'link' ) ).toBeInTheDocument();
		} );

		it( 'changes padding with the size prop', async () => {
			await render( <Item data-testid="medium">Medium</Item> );
			await render(
				<Item data-testid="large" size="large">
					Large
				</Item>
			);

			expect(
				window.getComputedStyle( screen.getByTestId( 'medium' ) )
					.paddingLeft
			).not.toBe(
				window.getComputedStyle( screen.getByTestId( 'large' ) )
					.paddingLeft
			);
		} );

		it( 'reads size from ItemGroup context unless the Item overrides it', async () => {
			await render(
				<ItemGroup size="large">
					<Item data-testid="inherited">Inherited</Item>
					<Item data-testid="overridden" size="small">
						Overridden
					</Item>
				</ItemGroup>
			);

			expect(
				window.getComputedStyle( screen.getByTestId( 'inherited' ) )
					.paddingLeft
			).toBe( '16.0008px' );
			expect(
				window.getComputedStyle( screen.getByTestId( 'overridden' ) )
					.paddingLeft
			).toBe( '8px' );
		} );
	} );
} );
