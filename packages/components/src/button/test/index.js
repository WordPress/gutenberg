/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import TestUtils from 'react-dom/test-utils';

/**
 * WordPress dependencies
 */
import { createRef } from '@wordpress/element';
import { plusCircle } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Button from '../';

jest.mock( '../../icon', () => () => <div data-testid="test-icon" /> );
jest.mock( '../../tooltip', () => ( { text, children } ) => (
	<div data-testid="test-tooltip" title={ text }>
		{ children }
	</div>
) );
jest.mock( '../../visually-hidden', () => ( {
	__esModule: true,
	VisuallyHidden: ( { children } ) => (
		<div data-testid="test-visually-hidden">{ children }</div>
	),
} ) );

describe( 'Button', () => {
	describe( 'basic rendering', () => {
		it( 'should render a button element with only one class', () => {
			render( <Button /> );
			const button = screen.getByRole( 'button' );

			expect( button ).toHaveClass( 'components-button' );
			expect( button ).not.toHaveClass( 'is-large' );
			expect( button ).not.toHaveClass( 'is-primary' );
			expect( button ).not.toHaveClass( 'is-pressed' );
			expect( button ).not.toHaveAttribute( 'disabled' );
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
			const button = screen.getByRole( 'button' );

			expect( button ).toHaveClass( 'is-pressed' );
		} );

		it( 'should add a disabled prop to the button', () => {
			render( <Button disabled /> );
			const button = screen.getByRole( 'button' );

			expect( button ).toHaveAttribute( 'disabled' );
		} );

		it( 'should add only aria-disabled attribute when disabled and isFocusable are true', () => {
			render( <Button disabled __experimentalIsFocusable /> );
			const button = screen.getByRole( 'button' );

			expect( button ).not.toHaveAttribute( 'disabled' );
			expect( button ).toHaveAttribute( 'aria-disabled' );
		} );

		it( 'should not pass the prop target into the element', () => {
			render( <Button target="_blank" /> );
			const button = screen.getByRole( 'button' );

			expect( button ).not.toHaveAttribute( 'target' );
		} );

		it( 'should render with an additional className', () => {
			render( <Button className="gutenberg" /> );
			const button = screen.getByRole( 'button' );

			expect( button ).toHaveClass( 'gutenberg' );
		} );

		it( 'should render an additional WordPress prop of value awesome', () => {
			render( <Button WordPress="awesome" /> );
			const button = screen.getByRole( 'button' );

			expect( console ).toHaveErrored();
			expect( button ).toHaveAttribute( 'wordpress', 'awesome' );
		} );

		it( 'should render an icon button', () => {
			render( <Button icon={ plusCircle } /> );
			const button = screen.getByRole( 'button' );

			expect( button ).toHaveClass( 'has-icon' );
			expect( button ).not.toHaveAttribute( 'aria-label' );
		} );

		it( 'should render a Dashicon component matching the wordpress icon', () => {
			render( <Button icon={ plusCircle } /> );
			const button = screen.getByRole( 'button' );

			expect( button ).toContainElement(
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
			const button = screen.getByRole( 'button' );

			expect( button ).toContainElement(
				screen.getByTestId( 'test-icon' )
			);

			const paragraph = button.childNodes[ 1 ];
			expect( paragraph ).toHaveClass( 'test' );
			expect( paragraph ).toHaveTextContent( 'Test' );
		} );

		it( 'should add an aria-label when the label property is used, with Tooltip wrapper', () => {
			render( <Button icon={ plusCircle } label="WordPress" /> );

			const tooltip = screen.getByTestId( 'test-tooltip' );
			expect( tooltip ).toBeVisible();
			expect( tooltip ).toHaveAttribute( 'title', 'WordPress' );

			const button = screen.getByRole( 'button' );
			expect( tooltip ).toContainElement( button );
			expect( button ).toHaveAttribute( 'aria-label', 'WordPress' );
		} );

		it( 'should support explicit aria-label override', () => {
			render( <Button aria-label="Custom" /> );
			const button = screen.getByRole( 'button' );

			expect( button ).toHaveAttribute( 'aria-label', 'Custom' );
		} );

		it( 'should support adding aria-describedby text', () => {
			render( <Button describedBy="Description text" /> );
			const button = screen.getByRole( 'button' );

			expect( button ).toHaveAttribute( 'aria-describedby' );
			expect(
				screen.getByTestId( 'test-visually-hidden' )
			).toHaveTextContent( 'Description text' );
		} );

		it( 'should populate tooltip with label content for buttons without visible labels (no children)', () => {
			render(
				<Button
					describedBy="Description text"
					label="Label"
					icon={ plusCircle }
				/>
			);

			expect( screen.getByTestId( 'test-tooltip' ) ).toHaveAttribute(
				'title',
				'Label'
			);
		} );

		it( 'should populate tooltip with description content for buttons with visible labels (buttons with children)', () => {
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

			expect( screen.getByTestId( 'test-tooltip' ) ).toHaveAttribute(
				'title',
				'Description text'
			);
		} );

		it( 'should allow tooltip disable', () => {
			render(
				<Button
					icon={ plusCircle }
					label="WordPress"
					showTooltip={ false }
				/>
			);
			const button = screen.getByRole( 'button' );

			expect( button.tagName ).toBe( 'BUTTON' );
			expect( button ).toHaveAttribute( 'aria-label', 'WordPress' );
		} );

		it( 'should show the tooltip for empty children', () => {
			const tooltip = render(
				<Button icon={ plusCircle } label="WordPress" children={ [] } />
			).container.firstChild;

			expect( tooltip ).toBe( screen.getByTestId( 'test-tooltip' ) );
			expect( tooltip ).toHaveAttribute( 'title', 'WordPress' );
		} );

		it( 'should not show the tooltip when icon and children defined', () => {
			render(
				<Button icon={ plusCircle } label="WordPress">
					Children
				</Button>
			);
			const button = screen.getByRole( 'button' );

			expect( button.tagName ).toBe( 'BUTTON' );
		} );

		it( 'should force showing the tooltip even if icon and children defined', () => {
			const tooltip = render(
				<Button icon={ plusCircle } label="WordPress" showTooltip>
					Children
				</Button>
			).container.firstChild;

			expect( tooltip ).toBe( screen.getByTestId( 'test-tooltip' ) );
		} );
	} );

	describe( 'with href property', () => {
		it( 'should render a link instead of a button with href prop', () => {
			const link = render( <Button href="https://wordpress.org/" /> )
				.container.firstChild;

			expect( link.tagName ).toBe( 'A' );
			expect( link ).toHaveAttribute( 'href', 'https://wordpress.org/' );
		} );

		it( 'should allow for the passing of the target prop when a link is created', () => {
			const link = render(
				<Button href="https://wordpress.org/" target="_blank" />
			).container.firstChild;

			expect( link ).toHaveAttribute( 'target', '_blank' );
		} );

		it( 'should become a button again when disabled is supplied', () => {
			const button = render(
				<Button href="https://wordpress.org/" disabled />
			).container.firstChild;

			expect( button.tagName ).toBe( 'BUTTON' );
		} );
	} );

	describe( 'ref forwarding', () => {
		it( 'should enable access to DOM element', () => {
			const ref = createRef();

			TestUtils.renderIntoDocument( <Button ref={ ref } /> );

			expect( ref.current.type ).toBe( 'button' );
		} );
	} );

	describe( 'deprecated props', () => {
		it( 'should not break when the legacy isPrimary prop is passed', () => {
			render( <Button isPrimary /> );
			const button = screen.getByRole( 'button' );
			expect( button ).toHaveClass( 'is-primary' );
		} );

		it( 'should not break when the legacy isSecondary prop is passed', () => {
			render( <Button isSecondary /> );
			const button = screen.getByRole( 'button' );
			expect( button ).toHaveClass( 'is-secondary' );
		} );

		it( 'should not break when the legacy isTertiary prop is passed', () => {
			render( <Button isTertiary /> );
			const button = screen.getByRole( 'button' );
			expect( button ).toHaveClass( 'is-tertiary' );
		} );

		it( 'should not break when the legacy isLink prop is passed', () => {
			render( <Button isLink /> );
			const button = screen.getByRole( 'button' );
			expect( button ).toHaveClass( 'is-link' );
		} );

		it( 'should warn when the isDefault prop is passed', () => {
			render( <Button isDefault /> );
			const button = screen.getByRole( 'button' );
			expect( button ).toHaveClass( 'is-secondary' );

			expect( console ).toHaveWarned();
		} );
	} );
} );
