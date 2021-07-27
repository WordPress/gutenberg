/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { Item, ItemGroup } from '..';
//  import { CONFIG } from '../../utils';

describe( 'ItemGroup', () => {
	describe( 'ItemGroup component', () => {
		it( 'should render correctly', () => {
			const wrapper = render(
				<ItemGroup>
					<Item>Code is poetry</Item>
				</ItemGroup>
			);
			expect( wrapper ).toMatchSnapshot();
		} );

		it( 'should show borders when the isBordered prop is true', () => {
			// By default, `isBordered` is `false`
			const { container: noBorders } = render(
				<ItemGroup>
					<Item>Code is poetry</Item>
				</ItemGroup>
			);

			const { container: withBorders } = render(
				<ItemGroup isBordered={ true }>
					<Item>Code is poetry</Item>
				</ItemGroup>
			);

			expect( noBorders.firstChild ).toMatchDiffSnapshot(
				withBorders.firstChild
			);
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

			expect( roundCorners.firstChild ).toMatchDiffSnapshot(
				squaredCorners.firstChild
			);
		} );

		it( 'should render items individually when the isSeparated prop is true', () => {
			// By default, `isSeparated` is `false`
			const { container: groupedItems } = render(
				<ItemGroup>
					<Item>Code is poetry</Item>
				</ItemGroup>
			);

			const { container: seperatedItems } = render(
				<ItemGroup isSeparated={ true }>
					<Item>Code is poetry</Item>
				</ItemGroup>
			);

			expect( groupedItems.firstChild ).toMatchDiffSnapshot(
				seperatedItems.firstChild
			);
		} );
	} );

	describe( 'Item', () => {
		it( 'should render a button with the isAction prop is true', () => {
			// By default, `isAction` is `false`
			const { container: normalItem } = render(
				<Item>Code is poetry</Item>
			);
			const { container: actionItem } = render(
				<Item isAction={ true }>Code is poetry</Item>
			);

			expect( normalItem.firstChild ).toMatchDiffSnapshot(
				actionItem.firstChild
			);
		} );

		it( 'should use different amounts of padding depending on the value of the size prop', () => {
			// By default, `size` is `medium`
			const { container: mediumSize } = render(
				<Item>Code is poetry</Item>
			);

			const { container: largeSize } = render(
				<Item size="large">Code is poetry</Item>
			);

			expect( mediumSize.firstChild ).toMatchDiffSnapshot(
				largeSize.firstChild
			);
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

			expect( mediumSize.firstChild ).toMatchDiffSnapshot(
				largeSize.firstChild
			);
		} );
	} );
} );
