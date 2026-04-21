/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import { Item, ItemGroup } from '..';

describe( 'ItemGroup', () => {
	describe( 'ItemGroup component', () => {
		it( 'should render correctly', () => {
			const { container } = render(
				<ItemGroup>
					<Item>Code is poetry</Item>
				</ItemGroup>
			);
			expect( container ).toMatchSnapshot();
		} );

		it( 'should show borders when the isBordered prop is true', () => {
			// By default, `isBordered` is `false`
			const { container: noBorders } = render(
				<ItemGroup>
					<Item>Code is poetry</Item>
				</ItemGroup>
			);

			const { container: withBorders } = render(
				<ItemGroup isBordered>
					<Item>Code is poetry</Item>
				</ItemGroup>
			);

			expect( noBorders ).toMatchDiffSnapshot( withBorders );
		} );

		it( 'should show rounded corners when the isRounded prop is true', () => {
			// By default, `isRounded` is `true`
			const { container: roundCorners } = render(
				<ItemGroup>
					<Item>Code is poetry</Item>
				</ItemGroup>
			);

			const { container: squaredCorners } = render(
				<ItemGroup isRounded={ false }>
					<Item>Code is poetry</Item>
				</ItemGroup>
			);

			expect( roundCorners ).toMatchDiffSnapshot( squaredCorners );
		} );

		it( 'should render items individually when the isSeparated prop is true', () => {
			// By default, `isSeparated` is `false`
			const { container: groupedItems } = render(
				<ItemGroup>
					<Item>Code is poetry</Item>
				</ItemGroup>
			);

			const { container: separatedItems } = render(
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
			render( <Item onClick={ spy }>Code is poetry</Item> );

			const button = screen.getByRole( 'button' );

			expect( button ).toBeInTheDocument();

			await user.click( button );

			expect( spy ).toHaveBeenCalled();
		} );

		it( 'should give priority to the `as` prop even if the `onClick` handler is specified', () => {
			const spy = jest.fn();
			const { rerender } = render(
				<Item onClick={ spy }>Code is poetry</Item>
			);

			expect( screen.getByRole( 'button' ) ).toBeInTheDocument();
			expect( screen.queryByRole( 'label' ) ).not.toBeInTheDocument();

			rerender(
				<Item as="a" href="#" onClick={ spy }>
					Code is poetry
				</Item>
			);

			expect( screen.queryByRole( 'button' ) ).not.toBeInTheDocument();
			expect( screen.getByRole( 'link' ) ).toBeInTheDocument();
		} );

		it( 'should use different amounts of padding depending on the value of the size prop', () => {
			// By default, `size` is `medium`
			const { container: mediumSize } = render(
				<Item>Code is poetry</Item>
			);

			const { container: largeSize } = render(
				<Item size="large">Code is poetry</Item>
			);

			expect( mediumSize ).toMatchDiffSnapshot( largeSize );
		} );

		it( 'should read the value of the size prop from context when the prop is not defined', () => {
			// By default, `size` is `medium`.
			// The instances of `Item` that don't specify a `size` prop, should
			// fallback to the value defined on `ItemGroup` via the context.
			const { container: mediumSize } = render(
				<ItemGroup>
					<Item>Code</Item>
					<Item>Is</Item>
					<Item size="small">Poetry</Item>
				</ItemGroup>
			);

			const { container: largeSize } = render(
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
