/**
 * External dependencies
 */
import { screen } from '@testing-library/react';
import { render } from '@ariakit/test/react';

/**
 * WordPress dependencies
 */
import { createRef } from '@wordpress/element';
import { plusCircle } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Button from '..';
import Tooltip from '../../tooltip';
import cleanupTooltip from '../../tooltip/test/utils';
import { press } from '@ariakit/test';

jest.mock( '../../icon', () => () => <div data-testid="test-icon" /> );

describe( 'Button', () => {
	describe( 'basic rendering', () => {
		it( 'should render a button element with only one class', async () => {
			await render( <Button /> );
			const button = screen.getByRole( 'button' );

			expect( button ).toHaveClass( 'components-button' );
			expect( button ).not.toHaveClass( 'is-large' );
			expect( button ).not.toHaveClass( 'is-primary' );
			expect( button ).not.toHaveClass( 'is-pressed' );
			expect( button ).toBeEnabled();
			expect( button ).not.toHaveAttribute( 'aria-disabled' );
			expect( button ).toHaveAttribute( 'type', 'button' );
		} );

		it( 'should render a button element with is-primary class', async () => {
			await render( <Button variant="primary" /> );
			const button = screen.getByRole( 'button' );

			expect( button ).not.toHaveClass( 'is-large' );
			expect( button ).toHaveClass( 'is-primary' );
		} );

		it( 'should render a button element with is-secondary and is-small class', async () => {
			await render( <Button variant="secondary" size="small" /> );
			const button = screen.getByRole( 'button' );

			expect( button ).toHaveClass( 'is-secondary' );
			expect( button ).not.toHaveClass( 'is-large' );
			expect( button ).toHaveClass( 'is-small' );
			expect( button ).not.toHaveClass( 'is-primary' );
		} );

		it( 'should render a button element with is-tertiary class', async () => {
			await render( <Button variant="tertiary" /> );
			const button = screen.getByRole( 'button' );

			expect( button ).not.toHaveClass( 'is-large' );
			expect( button ).not.toHaveClass( 'is-primary' );
			expect( button ).not.toHaveClass( 'is-secondary' );
			expect( button ).toHaveClass( 'is-tertiary' );
		} );

		it( 'should render a button element with is-link class', async () => {
			await render( <Button variant="link" /> );
			const button = screen.getByRole( 'button' );

			expect( button ).not.toHaveClass( 'is-primary' );
			expect( button ).not.toHaveClass( 'is-secondary' );
			expect( button ).not.toHaveClass( 'is-tertiary' );
			expect( button ).toHaveClass( 'is-link' );
		} );

		it( 'should render a button element with has-text when children are passed', async () => {
			await render( <Button icon={ plusCircle }>Children</Button> );

			// Move focus to the button
			await press.Tab();

			expect( screen.getByRole( 'button' ) ).toHaveClass( 'has-text' );
		} );

		it( 'should render a button element without has-text when children are not passed', async () => {
			await render( <Button icon={ plusCircle }></Button> );
			expect( screen.getByRole( 'button' ) ).not.toHaveClass(
				'has-text'
			);
		} );

		it( 'should render a button element without has-text when children are empty fragment', async () => {
			await render(
				<Button icon={ plusCircle }>
					<></>
				</Button>
			);
			expect( screen.getByRole( 'button' ) ).not.toHaveClass(
				'has-text'
			);
		} );

		it( 'should render a button element without has-text when a button wrapped in Tooltip', async () => {
			await render(
				<Tooltip text="Help text">
					<Button icon={ plusCircle } />
				</Tooltip>
			);
			expect( screen.getByRole( 'button' ) ).not.toHaveClass(
				'has-text'
			);
		} );

		it( 'should render correctly as a tooltip anchor', async () => {
			await render(
				<>
					<Tooltip text="Tooltip text">
						<Button icon={ plusCircle } label="Tooltip anchor" />
					</Tooltip>
					<Button>Focus me</Button>
				</>
			);

			const anchor = screen.getByRole( 'button', {
				name: 'Tooltip anchor',
			} );

			await press.Tab();

			expect( anchor ).toHaveFocus();

			const tooltip = await screen.findByRole( 'tooltip', {
				name: 'Tooltip text',
			} );

			expect( tooltip ).toBeVisible();

			await press.Tab();

			expect(
				screen.getByRole( 'button', { name: 'Focus me' } )
			).toHaveFocus();

			expect(
				screen.queryByRole( 'tooltip', {
					name: 'Tooltip text',
				} )
			).not.toBeInTheDocument();
		} );

		it( 'should render correctly as a tooltip anchor, ignoring its internal tooltip in favour of the external tooltip', async () => {
			await render(
				<>
					<Tooltip text="Tooltip text">
						<Button icon={ plusCircle } label="Button label" />
					</Tooltip>
					<Button>Focus me</Button>
				</>
			);

			const anchor = screen.getByRole( 'button', {
				name: 'Button label',
			} );

			await press.Tab();

			expect( anchor ).toHaveFocus();

			const tooltip = await screen.findByRole( 'tooltip', {
				name: 'Tooltip text',
			} );

			expect( tooltip ).toBeVisible();
			// Check that the tooltip that would be normally rendered internally by
			// the `Button` component is ignored, because of an outer tooltip.
			expect(
				screen.queryByRole( 'tooltip', {
					name: 'Button label',
				} )
			).not.toBeInTheDocument();

			await press.Tab();

			expect(
				screen.getByRole( 'button', { name: 'Focus me' } )
			).toHaveFocus();

			expect(
				screen.queryByRole( 'tooltip', {
					name: 'Tooltip text',
				} )
			).not.toBeInTheDocument();
		} );

		it( 'should not trash the rendered HTML elements when toggling between showing and not showing a tooltip', async () => {
			const { rerender } = await render(
				<Button label="Button label">Test button</Button>
			);

			const button = screen.getByRole( 'button', {
				name: 'Button label',
			} );

			expect( button ).toBeVisible();

			await press.Tab();

			expect( button ).toHaveFocus();

			// Re-render the button, but this time change the settings so that it
			// shows a tooltip.
			await rerender(
				<Button label="Button label" showTooltip>
					Test button
				</Button>
			);

			// The same button element that we referenced before should still be
			// in the document and have focus.
			expect( button ).toHaveFocus();

			// Re-render the button, but stop showing a tooltip.
			await rerender( <Button label="Button label">Test button</Button> );

			// The same button element that we referenced before should still be
			// in the document and have focus.
			expect( button ).toHaveFocus();
		} );

		it( 'should add a disabled prop to the button', async () => {
			// eslint-disable-next-line no-restricted-syntax
			await render( <Button disabled /> );

			expect( screen.getByRole( 'button' ) ).toBeDisabled();
		} );

		it( 'should add only aria-disabled attribute when disabled and isFocusable are true', async () => {
			await render( <Button disabled accessibleWhenDisabled /> );
			const button = screen.getByRole( 'button' );

			expect( button ).toBeEnabled();
			expect( button ).toHaveAttribute( 'aria-disabled' );
		} );

		it( 'should not pass the prop target into the element', async () => {
			// @ts-expect-error - `target` requires `href`
			await render( <Button target="_blank" /> );

			expect( screen.getByRole( 'button' ) ).not.toHaveAttribute(
				'target'
			);
		} );

		it( 'should render with an additional className', async () => {
			await render( <Button className="gutenberg" /> );

			expect( screen.getByRole( 'button' ) ).toHaveClass( 'gutenberg' );
		} );

		it( 'should pass additional props to the element', async () => {
			await render( <Button type="submit" /> );

			expect( screen.getByRole( 'button' ) ).toHaveAttribute(
				'type',
				'submit'
			);
		} );

		it( 'should render an icon button', async () => {
			await render( <Button icon={ plusCircle } /> );
			const button = screen.getByRole( 'button' );

			expect( button ).toHaveClass( 'has-icon' );
			expect( button ).not.toHaveAttribute( 'aria-label' );
		} );

		it( 'should render a Dashicon component matching the wordpress icon', async () => {
			await render( <Button icon={ plusCircle } /> );

			expect( screen.getByRole( 'button' ) ).toContainElement(
				screen.getByTestId( 'test-icon' )
			);
		} );

		it( 'should render child elements and icon', async () => {
			await render(
				<Button
					icon={ plusCircle }
					children={ <p className="test">Test</p> }
				/>
			);

			expect( screen.getByRole( 'button' ) ).toContainElement(
				screen.getByTestId( 'test-icon' )
			);

			const paragraph = screen.getByText( 'Test' );
			expect( paragraph ).toBeVisible();
			expect( paragraph ).toHaveClass( 'test' );
		} );

		it( 'should add an aria-label when the label property is used, with Tooltip wrapper', async () => {
			await render( <Button icon={ plusCircle } label="WordPress" /> );

			expect( screen.queryByText( 'WordPress' ) ).not.toBeInTheDocument();

			// Move focus to the button
			await press.Tab();

			expect( screen.getByText( 'WordPress' ) ).toBeVisible();
		} );

		it( 'should support explicit aria-label override', async () => {
			await render( <Button aria-label="Custom" /> );

			expect( screen.getByRole( 'button' ) ).toHaveAttribute(
				'aria-label',
				'Custom'
			);
		} );

		it( 'should support adding aria-describedby text', async () => {
			await render( <Button description="Description text" /> );
			expect(
				screen.getByRole( 'button', {
					description: 'Description text',
				} )
			).toBeVisible();
		} );

		it( 'should populate tooltip with label content for buttons without visible labels (no children)', async () => {
			await render(
				<Button
					description="Description text"
					label="Label"
					icon={ plusCircle }
				/>
			);

			expect( screen.queryByText( 'Label' ) ).not.toBeInTheDocument();

			// Move focus to the button
			await press.Tab();

			expect( screen.getByText( 'Label' ) ).toBeVisible();

			await cleanupTooltip();
		} );

		it( 'should populate tooltip with description content for buttons with visible labels (buttons with children)', async () => {
			await render(
				<Button
					label="Label"
					description="Description text"
					icon={ plusCircle }
					showTooltip
				>
					Children
				</Button>
			);

			expect(
				screen.getByRole( 'button', {
					description: 'Description text',
				} )
			).toBeVisible();

			await press.Tab();

			expect(
				screen.getByRole( 'tooltip', {
					name: 'Description text',
				} )
			).toBeVisible();

			await cleanupTooltip();
		} );

		it( 'should allow tooltip disable', async () => {
			await render(
				<Button
					icon={ plusCircle }
					label="WordPress"
					showTooltip={ false }
				/>
			);

			expect(
				screen.getByRole( 'button', { name: 'WordPress' } )
			).toHaveAttribute( 'aria-label', 'WordPress' );

			expect( screen.queryByText( 'WordPress' ) ).not.toBeInTheDocument();

			// Move focus to the button
			await press.Tab();

			expect( screen.queryByText( 'WordPress' ) ).not.toBeInTheDocument();
		} );

		it( 'should show the tooltip for empty children', async () => {
			await render(
				<Button icon={ plusCircle } label="WordPress" children={ [] } />
			);

			expect( screen.queryByText( 'WordPress' ) ).not.toBeInTheDocument();

			// Move focus to the button
			await press.Tab();

			expect( screen.getByText( 'WordPress' ) ).toBeVisible();

			await cleanupTooltip();
		} );

		it( 'should not show the tooltip when icon and children defined', async () => {
			await render(
				<Button icon={ plusCircle } label="WordPress">
					Children
				</Button>
			);

			expect( screen.queryByText( 'WordPress' ) ).not.toBeInTheDocument();

			// Move focus to the button
			await press.Tab();

			expect( screen.queryByText( 'WordPress' ) ).not.toBeInTheDocument();
		} );

		it( 'should force showing the tooltip even if icon and children defined', async () => {
			await render(
				<Button icon={ plusCircle } label="WordPress" showTooltip>
					Children
				</Button>
			);

			expect( screen.queryByText( 'WordPress' ) ).not.toBeInTheDocument();

			// Move focus to the button
			await press.Tab();

			expect( screen.getByText( 'WordPress' ) ).toBeVisible();

			await cleanupTooltip();
		} );

		describe( 'using `aria-pressed` prop', () => {
			it( 'should render a button element with is-pressed when `true`', async () => {
				await render( <Button aria-pressed /> );

				expect( screen.getByRole( 'button' ) ).toHaveClass(
					'is-pressed'
				);
			} );

			it( 'should render a button element with is-pressed when `"true"`', async () => {
				await render( <Button aria-pressed="true" /> );

				expect( screen.getByRole( 'button' ) ).toHaveClass(
					'is-pressed'
				);
			} );

			it( 'should render a button element with is-pressed/is-pressed-mixed when `"mixed"`', async () => {
				await render( <Button aria-pressed="mixed" /> );

				expect( screen.getByRole( 'button' ) ).toHaveClass(
					'is-pressed is-pressed-mixed'
				);
			} );

			it( 'should render a button element without is-pressed when `undefined`', async () => {
				await render( <Button aria-pressed={ undefined } /> );

				expect( screen.getByRole( 'button' ) ).not.toHaveClass(
					'is-pressed'
				);
			} );

			it( 'should render a button element without is-pressed when `false`', async () => {
				await render( <Button aria-pressed={ false } /> );

				expect( screen.getByRole( 'button' ) ).not.toHaveClass(
					'is-pressed'
				);
			} );

			it( 'should render a button element without is-pressed when `"false"`', async () => {
				await render( <Button aria-pressed="false" /> );

				expect( screen.getByRole( 'button' ) ).not.toHaveClass(
					'is-pressed'
				);
			} );
		} );
	} );

	describe( 'with href property', () => {
		it( 'should render a link instead of a button with href prop', async () => {
			await render( <Button href="https://wordpress.org/" /> );

			expect( screen.getByRole( 'link' ) ).toHaveAttribute(
				'href',
				'https://wordpress.org/'
			);
		} );

		it( 'should allow for the passing of the target prop when a link is created', async () => {
			await render(
				<Button href="https://wordpress.org/" target="_blank" />
			);

			expect( screen.getByRole( 'link' ) ).toHaveAttribute(
				'target',
				'_blank'
			);
		} );

		it( 'should become a button again when disabled is supplied', async () => {
			// @ts-expect-error - a button should not have `href`
			// eslint-disable-next-line no-restricted-syntax
			await render( <Button href="https://wordpress.org/" disabled /> );

			expect( screen.getByRole( 'button' ) ).toBeVisible();
		} );

		it( 'should become a button again when disabled is supplied, even with `accessibleWhenDisabled`', async () => {
			await render(
				<Button
					// @ts-expect-error - a button should not have `href`
					// eslint-disable-next-line no-restricted-syntax
					href="https://wordpress.org/"
					disabled
					accessibleWhenDisabled
				/>
			);
			expect( screen.getByRole( 'button' ) ).toBeVisible();
		} );
	} );

	describe( 'ref forwarding', () => {
		it( 'should enable access to DOM element', async () => {
			const ref = createRef();

			await render( <Button ref={ ref } /> );

			expect( ref.current ).toBe( screen.getByRole( 'button' ) );
		} );
	} );

	describe( 'deprecated props', () => {
		it( 'should not break when the legacy isPrimary prop is passed', async () => {
			await render( <Button isPrimary /> );
			expect( screen.getByRole( 'button' ) ).toHaveClass( 'is-primary' );
		} );

		it( 'should not break when the legacy isSecondary prop is passed', async () => {
			await render( <Button isSecondary /> );
			expect( screen.getByRole( 'button' ) ).toHaveClass(
				'is-secondary'
			);
		} );

		it( 'should not break when the legacy isTertiary prop is passed', async () => {
			await render( <Button isTertiary /> );
			expect( screen.getByRole( 'button' ) ).toHaveClass( 'is-tertiary' );
		} );

		it( 'should not break when the legacy isLink prop is passed', async () => {
			await render( <Button isLink /> );
			expect( screen.getByRole( 'button' ) ).toHaveClass( 'is-link' );
		} );

		it( 'should warn when the isDefault prop is passed', async () => {
			await render( <Button isDefault /> );
			expect( screen.getByRole( 'button' ) ).toHaveClass(
				'is-secondary'
			);
			expect( console ).toHaveWarned();
		} );

		it( 'should not break when the legacy isSmall prop is passed', async () => {
			await render( <Button isSmall /> );
			expect( screen.getByRole( 'button' ) ).toHaveClass( 'is-small' );
		} );

		it( 'should have the is-small class when small class prop is passed', async () => {
			await render( <Button size="small" /> );
			expect( screen.getByRole( 'button' ) ).toHaveClass( 'is-small' );
		} );

		it( 'should prioritize the `size` prop over `isSmall`', async () => {
			await render( <Button size="compact" isSmall /> );
			expect( screen.getByRole( 'button' ) ).not.toHaveClass(
				'is-small'
			);
			expect( screen.getByRole( 'button' ) ).toHaveClass( 'is-compact' );
		} );

		it( 'should not break when the legacy isPressed prop is passed', async () => {
			await render( <Button isPressed /> );

			expect( screen.getByRole( 'button' ) ).toHaveAttribute(
				'aria-pressed',
				'true'
			);
		} );

		it( 'should prioritize the `aria-pressed` prop over `isPressed`', async () => {
			await render( <Button isPressed aria-pressed="mixed" /> );
			expect( screen.getByRole( 'button' ) ).toHaveAttribute(
				'aria-pressed',
				'mixed'
			);
		} );

		it( 'should not break when the legacy __experimentalIsFocusable prop is passed', async () => {
			// eslint-disable-next-line no-restricted-syntax
			await render( <Button disabled __experimentalIsFocusable /> );
			const button = screen.getByRole( 'button' );

			expect( button ).toBeEnabled();
			expect( button ).toHaveAttribute( 'aria-disabled' );
		} );
	} );

	describe( 'static typing', () => {
		<>
			<Button href="foo" />
			{ /* @ts-expect-error - `target` requires `href` */ }
			<Button target="foo" />

			{ /* eslint-disable no-restricted-syntax */ }
			{ /* @ts-expect-error - `disabled` is only for buttons */ }
			<Button href="foo" disabled />
			{ /* eslint-enable no-restricted-syntax */ }

			<Button href="foo" type="image/png" />
			{ /* @ts-expect-error - if button, type must be submit/reset/button */ }
			<Button type="image/png" />
			{ /* @ts-expect-error */ }
			<Button type="invalidtype" />
			{ /* @ts-expect-error */ }
			<Button disabled accessibleWhenDisabled href="foo" />
		</>;
	} );
} );
