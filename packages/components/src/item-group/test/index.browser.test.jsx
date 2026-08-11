import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Item, ItemGroup } from '..';

describe( 'ItemGroup', () => {
	it( 'renders its items', () => {
		render(
			<ItemGroup data-testid="group">
				<Item>Code is poetry</Item>
			</ItemGroup>
		);

		expect( screen.getByTestId( 'group' ) ).toHaveTextContent(
			'Code is poetry'
		);
	} );

	it( 'shows borders when isBordered is true', () => {
		render(
			<ItemGroup data-testid="plain">
				<Item>Plain</Item>
			</ItemGroup>
		);
		render(
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

	it( 'shows rounded corners when isRounded is true', () => {
		/* eslint-disable @wordpress/no-setting-ds-tokens -- This fixture supplies the design token consumed by ItemGroup. */
		render(
			<ItemGroup
				data-testid="rounded"
				style={ { '--wpds-border-radius-sm': '4px' } }
			>
				<Item>Rounded</Item>
			</ItemGroup>
		);
		/* eslint-enable @wordpress/no-setting-ds-tokens */
		render(
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

	it( 'separates items when isSeparated is true', () => {
		render(
			<ItemGroup>
				<Item data-testid="grouped-item">Grouped</Item>
			</ItemGroup>
		);
		render(
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
		it( 'renders as a button when onClick is specified', async () => {
			const user = userEvent.setup();
			const onClick = vi.fn();
			render( <Item onClick={ onClick }>Code is poetry</Item> );

			await user.click( screen.getByRole( 'button' ) );

			expect( onClick ).toHaveBeenCalledOnce();
		} );

		it( 'gives priority to the as prop over onClick', () => {
			const onClick = vi.fn();
			const { rerender } = render(
				<Item onClick={ onClick }>Code is poetry</Item>
			);

			expect( screen.getByRole( 'button' ) ).toBeInTheDocument();

			rerender(
				<Item as="a" href="#" onClick={ onClick }>
					Code is poetry
				</Item>
			);

			expect( screen.queryByRole( 'button' ) ).not.toBeInTheDocument();
			expect( screen.getByRole( 'link' ) ).toBeInTheDocument();
		} );

		it( 'changes padding with the size prop', () => {
			render( <Item data-testid="medium">Medium</Item> );
			render(
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

		it( 'reads size from ItemGroup context unless the Item overrides it', () => {
			render(
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
