/**
 * External dependencies
 */
import { screen } from '@testing-library/react';
import { render } from '@ariakit/test/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import { Item, ItemGroup } from '..';

describe( 'ItemGroup', () => {
	describe( 'ItemGroup component', () => {
		it( 'should render correctly', async () => {
			const { container } = await render(
				<ItemGroup>
					<Item>Code is poetry</Item>
				</ItemGroup>
			);
			expect( container ).toMatchSnapshot();
		} );

		it( 'should show borders when the isBordered prop is true', async () => {
			// By default, `isBordered` is `false`
			const { container: noBorders } = await render(
				<ItemGroup>
					<Item>Code is poetry</Item>
				</ItemGroup>
			);

			const { container: withBorders } = await render(
				<ItemGroup isBordered>
					<Item>Code is poetry</Item>
				</ItemGroup>
			);

			expect( noBorders ).toMatchDiffSnapshot( withBorders );
		} );

		it( 'should show rounded corners when the isRounded prop is true', async () => {
			// By default, `isRounded` is `true`
			const { container: roundCorners } = await render(
				<ItemGroup>
					<Item>Code is poetry</Item>
				</ItemGroup>
			);

			const { container: squaredCorners } = await render(
				<ItemGroup isRounded={ false }>
					<Item>Code is poetry</Item>
				</ItemGroup>
			);

			expect( roundCorners ).toMatchDiffSnapshot( squaredCorners );
		} );

		it( 'should render items individually when the isSeparated prop is true', async () => {
			// By default, `isSeparated` is `false`
			const { container: groupedItems } = await render(
				<ItemGroup>
					<Item>Code is poetry</Item>
				</ItemGroup>
			);

			const { container: separatedItems } = await render(
				<ItemGroup isSeparated>
					<Item>Code is poetry</Item>
				</ItemGroup>
			);

			expect( groupedItems ).toMatchDiffSnapshot( separatedItems );
		} );
	} );

	describe( 'Item', () => {
		it( 'should render as a `button` if the `onClick` handler is specified', async () => {
			const user = userEvent.setup();
			const spy = jest.fn();
			await render( <Item onClick={ spy }>Code is poetry</Item> );

			const button = screen.getByRole( 'button' );

			expect( button ).toBeInTheDocument();

			await user.click( button );

			expect( spy ).toHaveBeenCalled();
		} );

		it( 'should give priority to the `as` prop even if the `onClick` handler is specified', async () => {
			const spy = jest.fn();
			const { rerender } = await render(
				<Item onClick={ spy }>Code is poetry</Item>
			);

			expect( screen.getByRole( 'button' ) ).toBeInTheDocument();
			expect( screen.queryByRole( 'label' ) ).not.toBeInTheDocument();

			await rerender(
				<Item as="a" href="#" onClick={ spy }>
					Code is poetry
				</Item>
			);

			expect( screen.queryByRole( 'button' ) ).not.toBeInTheDocument();
			expect( screen.getByRole( 'link' ) ).toBeInTheDocument();
		} );

		it( 'should use different amounts of padding depending on the value of the size prop', async () => {
			// By default, `size` is `medium`
			const { container: mediumSize } = await render(
				<Item>Code is poetry</Item>
			);

			const { container: largeSize } = await render(
				<Item size="large">Code is poetry</Item>
			);

			expect( mediumSize ).toMatchDiffSnapshot( largeSize );
		} );

		it( 'should read the value of the size prop from context when the prop is not defined', async () => {
			// By default, `size` is `medium`.
			// The instances of `Item` that don't specify a `size` prop, should
			// fallback to the value defined on `ItemGroup` via the context.
			const { container: mediumSize } = await render(
				<ItemGroup>
					<Item>Code</Item>
					<Item>Is</Item>
					<Item size="small">Poetry</Item>
				</ItemGroup>
			);

			const { container: largeSize } = await render(
				<ItemGroup size="large">
					<Item>Code</Item>
					<Item>Is</Item>
					<Item size="small">Poetry</Item>
				</ItemGroup>
			);

			expect( mediumSize ).toMatchDiffSnapshot( largeSize );
		} );
	} );
} );
