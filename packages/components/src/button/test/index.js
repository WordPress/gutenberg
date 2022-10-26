/**
 * External dependencies
 */
import { act, render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { createRef } from '@wordpress/element';
import { plusCircle } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Button from '../';
import { Tooltip } from '../../';

jest.mock( '../../icon', () => () => <div data-testid="test-icon" /> );

describe( 'Button', () => {
	describe( 'basic rendering', () => {
		it( 'should render a button element with only one class', () => {
			render( <Button /> );
			const button = screen.getByRole( 'button' );

			expect( button ).toHaveClass( 'components-button' );
			expect( button ).not.toHaveClass( 'is-large' );
			expect( button ).not.toHaveClass( 'is-primary' );
			expect( button ).not.toHaveClass( 'is-pressed' );
			expect( button ).toBeEnabled();
			expect( button ).not.toHaveAttribute( 'aria-disabled' );
			expect( button ).toHaveAttribute( 'type', 'button' );
		} );

		it( 'should render a button element with is-primary class', () => {
			render( <Button variant="primary" /> );
			const button = screen.getByRole( 'button' );

			expect( button ).not.toHaveClass( 'is-large' );
			expect( button ).toHaveClass( 'is-primary' );
		} );

		it( 'should render a button element with is-secondary and is-small class', () => {
			render( <Button variant="secondary" isSmall /> );
			const button = screen.getByRole( 'button' );

			expect( button ).toHaveClass( 'is-secondary' );
			expect( button ).not.toHaveClass( 'is-large' );
			expect( button ).toHaveClass( 'is-small' );
			expect( button ).not.toHaveClass( 'is-primary' );
		} );

		it( 'should render a button element with is-tertiary class', () => {
			render( <Button variant="tertiary" /> );
			const button = screen.getByRole( 'button' );

			expect( button ).not.toHaveClass( 'is-large' );
			expect( button ).not.toHaveClass( 'is-primary' );
			expect( button ).not.toHaveClass( 'is-secondary' );
			expect( button ).toHaveClass( 'is-tertiary' );
		} );

		it( 'should render a button element with is-link class', () => {
			render( <Button variant="link" /> );
			const button = screen.getByRole( 'button' );

			expect( button ).not.toHaveClass( 'is-primary' );
			expect( button ).not.toHaveClass( 'is-secondary' );
			expect( button ).not.toHaveClass( 'is-tertiary' );
			expect( button ).toHaveClass( 'is-link' );
		} );

		it( 'should render a button element with is-pressed without button class', () => {
			render( <Button isPressed /> );

			expect( screen.getByRole( 'button' ) ).toHaveClass( 'is-pressed' );
		} );

		it( 'should render a button element with has-text when children are passed', () => {
			render( <Button icon={ plusCircle }>Children</Button> );
			act( () => screen.getByRole( 'button' ).focus() );
			expect( screen.getByRole( 'button' ) ).toHaveClass( 'has-text' );
		} );

		it( 'should render a button element without has-text when children are not passed', () => {
			render( <Button icon={ plusCircle }></Button> );
			expect( screen.getByRole( 'button' ) ).not.toHaveClass(
				'has-text'
			);
		} );

		it( 'should render a button element without has-text when children are empty fragment', () => {
			render(
				<Button icon={ plusCircle }>
					<></>
				</Button>
			);
			expect( screen.getByRole( 'button' ) ).not.toHaveClass(
				'has-text'
			);
		} );

		it( 'should render a button element without has-text when a button wrapped in Tooltip', () => {
			render(
				<Tooltip text="Help text">
					<Button icon={ plusCircle } />
				</Tooltip>
			);
			expect( screen.getByRole( 'button' ) ).not.toHaveClass(
				'has-text'
			);
		} );

		it( 'should add a disabled prop to the button', () => {
			render( <Button disabled /> );

			expect( screen.getByRole( 'button' ) ).toBeDisabled();
		} );

		it( 'should add only aria-disabled attribute when disabled and isFocusable are true', () => {
			render( <Button disabled __experimentalIsFocusable /> );
			const button = screen.getByRole( 'button' );

			expect( button ).toBeEnabled();
			expect( button ).toHaveAttribute( 'aria-disabled' );
		} );

		it( 'should not pass the prop target into the element', () => {
			render( <Button target="_blank" /> );

			expect( screen.getByRole( 'button' ) ).not.toHaveAttribute(
				'target'
			);
		} );

		it( 'should render with an additional className', () => {
			render( <Button className="gutenberg" /> );

			expect( screen.getByRole( 'button' ) ).toHaveClass( 'gutenberg' );
		} );

		it( 'should render an additional WordPress prop of value awesome', () => {
			render( <Button WordPress="awesome" /> );

			expect( console ).toHaveErrored();
			expect( screen.getByRole( 'button' ) ).toHaveAttribute(
				'wordpress',
				'awesome'
			);
		} );

		it( 'should render an icon button', () => {
			render( <Button icon={ plusCircle } /> );
			const button = screen.getByRole( 'button' );

			expect( button ).toHaveClass( 'has-icon' );
			expect( button ).not.toHaveAttribute( 'aria-label' );
		} );

		it( 'should render a Dashicon component matching the wordpress icon', () => {
			render( <Button icon={ plusCircle } /> );

			expect( screen.getByRole( 'button' ) ).toContainElement(
				screen.getByTestId( 'test-icon' )
			);
		} );

		it( 'should render child elements and icon', () => {
			render(
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
			render( <Button icon={ plusCircle } label="WordPress" /> );
			// Wait for the `floating-ui` effects in `Tooltip`/`Popover` to finish running
			// See also: https://floating-ui.com/docs/react-dom#testing
			await act( () => Promise.resolve() );

			expect( screen.queryByText( 'WordPress' ) ).not.toBeInTheDocument();

			await act( () => {
				screen.getByRole( 'button', { name: 'WordPress' } ).focus();
			} );

			expect( screen.getByText( 'WordPress' ) ).toBeVisible();
		} );

		it( 'should support explicit aria-label override', () => {
			render( <Button aria-label="Custom" /> );

			expect( screen.getByRole( 'button' ) ).toHaveAttribute(
				'aria-label',
				'Custom'
			);
		} );

		it( 'should support adding aria-describedby text', () => {
			render( <Button describedBy="Description text" /> );
			expect(
				screen.getByRole( 'button', {
					description: 'Description text',
				} )
			).toBeVisible();
		} );

		it( 'should populate tooltip with label content for buttons without visible labels (no children)', async () => {
			render(
				<Button
					describedBy="Description text"
					label="Label"
					icon={ plusCircle }
				/>
			);
			await act( () => Promise.resolve() );

			expect( screen.queryByText( 'Label' ) ).not.toBeInTheDocument();

			await act( async () => {
				screen.getByRole( 'button', { name: 'Label' } ).focus();
			} );

			expect( screen.getByText( 'Label' ) ).toBeVisible();
		} );

		it( 'should populate tooltip with description content for buttons with visible labels (buttons with children)', async () => {
			render(
				<Button
					label="Label"
					describedBy="Description text"
					icon={ plusCircle }
					showTooltip
				>
					Children
				</Button>
			);
			await act( () => Promise.resolve() );

			expect(
				screen.getByRole( 'button', {
					description: 'Description text',
				} )
			).toBeVisible();
		} );

		it( 'should allow tooltip disable', () => {
			render(
				<Button
					icon={ plusCircle }
					label="WordPress"
					showTooltip={ false }
				/>
			);
			const button = screen.getByRole( 'button', { name: 'WordPress' } );

			expect( button ).toHaveAttribute( 'aria-label', 'WordPress' );

			expect( screen.queryByText( 'WordPress' ) ).not.toBeInTheDocument();

			act( () => button.focus() );

			expect( screen.queryByText( 'WordPress' ) ).not.toBeInTheDocument();
		} );

		it( 'should show the tooltip for empty children', async () => {
			render(
				<Button icon={ plusCircle } label="WordPress" children={ [] } />
			);
			await act( () => Promise.resolve() );

			expect( screen.queryByText( 'WordPress' ) ).not.toBeInTheDocument();

			await act( async () => {
				screen.getByRole( 'button', { name: 'WordPress' } ).focus();
			} );

			expect( screen.getByText( 'WordPress' ) ).toBeVisible();
		} );

		it( 'should not show the tooltip when icon and children defined', () => {
			render(
				<Button icon={ plusCircle } label="WordPress">
					Children
				</Button>
			);

			expect( screen.queryByText( 'WordPress' ) ).not.toBeInTheDocument();

			act( () => {
				screen.getByRole( 'button', { name: 'WordPress' } ).focus();
			} );

			expect( screen.queryByText( 'WordPress' ) ).not.toBeInTheDocument();
		} );

		it( 'should force showing the tooltip even if icon and children defined', async () => {
			render(
				<Button icon={ plusCircle } label="WordPress" showTooltip>
					Children
				</Button>
			);
			await act( () => Promise.resolve() );

			expect( screen.queryByText( 'WordPress' ) ).not.toBeInTheDocument();

			await act( async () => {
				screen.getByRole( 'button', { name: 'WordPress' } ).focus();
			} );

			expect( screen.getByText( 'WordPress' ) ).toBeVisible();
		} );
	} );

	describe( 'with href property', () => {
		it( 'should render a link instead of a button with href prop', () => {
			render( <Button href="https://wordpress.org/" /> );

			expect( screen.getByRole( 'link' ) ).toHaveAttribute(
				'href',
				'https://wordpress.org/'
			);
		} );

		it( 'should allow for the passing of the target prop when a link is created', () => {
			render( <Button href="https://wordpress.org/" target="_blank" /> );

			expect( screen.getByRole( 'link' ) ).toHaveAttribute(
				'target',
				'_blank'
			);
		} );

		it( 'should become a button again when disabled is supplied', () => {
			render( <Button href="https://wordpress.org/" disabled /> );

			expect( screen.getByRole( 'button' ) ).toBeVisible();
		} );
	} );

	describe( 'ref forwarding', () => {
		it( 'should enable access to DOM element', () => {
			const ref = createRef();

			render( <Button ref={ ref } /> );

			expect( ref.current ).toBe( screen.getByRole( 'button' ) );
		} );
	} );

	describe( 'deprecated props', () => {
		it( 'should not break when the legacy isPrimary prop is passed', () => {
			render( <Button isPrimary /> );
			expect( screen.getByRole( 'button' ) ).toHaveClass( 'is-primary' );
		} );

		it( 'should not break when the legacy isSecondary prop is passed', () => {
			render( <Button isSecondary /> );
			expect( screen.getByRole( 'button' ) ).toHaveClass(
				'is-secondary'
			);
		} );

		it( 'should not break when the legacy isTertiary prop is passed', () => {
			render( <Button isTertiary /> );
			expect( screen.getByRole( 'button' ) ).toHaveClass( 'is-tertiary' );
		} );

		it( 'should not break when the legacy isLink prop is passed', () => {
			render( <Button isLink /> );
			expect( screen.getByRole( 'button' ) ).toHaveClass( 'is-link' );
		} );

		it( 'should warn when the isDefault prop is passed', () => {
			render( <Button isDefault /> );
			expect( screen.getByRole( 'button' ) ).toHaveClass(
				'is-secondary'
			);
			expect( console ).toHaveWarned();
		} );
	} );
} );
