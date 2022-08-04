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
			const button = render( <Button /> ).container.firstChild;

			expect( button ).toHaveClass( 'components-button' );
			expect( button ).not.toHaveClass( 'is-large' );
			expect( button ).not.toHaveClass( 'is-primary' );
			expect( button ).not.toHaveClass( 'is-pressed' );
			expect( button ).not.toHaveAttribute( 'disabled' );
			expect( button ).not.toHaveAttribute( 'aria-disabled' );
			expect( button ).toHaveAttribute( 'type', 'button' );
			expect( button.tagName ).toBe( 'BUTTON' );
		} );

		it( 'should render a button element with is-primary class', () => {
			const button = render( <Button variant="primary" /> ).container
				.firstChild;

			expect( button ).not.toHaveClass( 'is-large' );
			expect( button ).toHaveClass( 'is-primary' );
		} );

		it( 'should render a button element with is-secondary and is-small class', () => {
			const button = render( <Button variant="secondary" isSmall /> )
				.container.firstChild;

			expect( button ).toHaveClass( 'is-secondary' );
			expect( button ).not.toHaveClass( 'is-large' );
			expect( button ).toHaveClass( 'is-small' );
			expect( button ).not.toHaveClass( 'is-primary' );
		} );

		it( 'should render a button element with is-tertiary class', () => {
			const button = render( <Button variant="tertiary" /> ).container
				.firstChild;

			expect( button ).not.toHaveClass( 'is-large' );
			expect( button ).not.toHaveClass( 'is-primary' );
			expect( button ).not.toHaveClass( 'is-secondary' );
			expect( button ).toHaveClass( 'is-tertiary' );
		} );

		it( 'should render a button element with is-link class', () => {
			const button = render( <Button variant="link" /> ).container
				.firstChild;

			expect( button ).not.toHaveClass( 'is-primary' );
			expect( button ).not.toHaveClass( 'is-secondary' );
			expect( button ).not.toHaveClass( 'is-tertiary' );
			expect( button ).toHaveClass( 'is-link' );
		} );

		it( 'should render a button element with is-pressed without button class', () => {
			const button = render( <Button isPressed /> ).container.firstChild;

			expect( button ).toHaveClass( 'is-pressed' );
		} );

		it( 'should add a disabled prop to the button', () => {
			const button = render( <Button disabled /> ).container.firstChild;

			expect( button ).toHaveAttribute( 'disabled' );
		} );

		it( 'should add only aria-disabled attribute when disabled and isFocusable are true', () => {
			const button = render(
				<Button disabled __experimentalIsFocusable />
			).container.firstChild;

			expect( button ).not.toHaveAttribute( 'disabled' );
			expect( button ).toHaveAttribute( 'aria-disabled' );
		} );

		it( 'should not pass the prop target into the element', () => {
			const button = render( <Button target="_blank" /> ).container
				.firstChild;

			expect( button ).not.toHaveAttribute( 'target' );
		} );

		it( 'should render with an additional className', () => {
			const button = render( <Button className="gutenberg" /> ).container
				.firstChild;

			expect( button ).toHaveClass( 'gutenberg' );
		} );

		it( 'should render an additional WordPress prop of value awesome', () => {
			const button = render( <Button WordPress="awesome" /> ).container
				.firstChild;

			expect( console ).toHaveErrored();
			expect( button ).toHaveAttribute( 'wordpress', 'awesome' );
		} );

		it( 'should render an icon button', () => {
			const button = render( <Button icon={ plusCircle } /> ).container
				.firstChild;

			expect( button ).toHaveClass( 'has-icon' );
			expect( button ).not.toHaveAttribute( 'aria-label' );
		} );

		it( 'should render a Dashicon component matching the wordpress icon', () => {
			const button = render( <Button icon={ plusCircle } /> ).container
				.firstChild;

			expect( button ).toContainElement(
				screen.getByTestId( 'test-icon' )
			);
		} );

		it( 'should render child elements and icon', () => {
			const button = render(
				<Button
					icon={ plusCircle }
					children={ <p className="test">Test</p> }
				/>
			).container.firstChild;

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
			const button = render( <Button aria-label="Custom" /> ).container
				.firstChild;

			expect( button ).toHaveAttribute( 'aria-label', 'Custom' );
		} );

		it( 'should support adding aria-describedby text', () => {
			const button = render( <Button describedBy="Description text" /> )
				.container.firstChild;

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
			const button = render(
				<Button
					icon={ plusCircle }
					label="WordPress"
					showTooltip={ false }
				/>
			).container.firstChild;

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
			const button = render(
				<Button icon={ plusCircle } label="WordPress">
					Children
				</Button>
			).container.firstChild;

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
			const button = render( <Button isPrimary /> ).container.firstChild;
			expect( button ).toHaveClass( 'is-primary' );
		} );

		it( 'should not break when the legacy isSecondary prop is passed', () => {
			const button = render( <Button isSecondary /> ).container
				.firstChild;
			expect( button ).toHaveClass( 'is-secondary' );
		} );

		it( 'should not break when the legacy isTertiary prop is passed', () => {
			const button = render( <Button isTertiary /> ).container.firstChild;
			expect( button ).toHaveClass( 'is-tertiary' );
		} );

		it( 'should not break when the legacy isLink prop is passed', () => {
			const button = render( <Button isLink /> ).container.firstChild;
			expect( button ).toHaveClass( 'is-link' );
		} );

		it( 'should warn when the isDefault prop is passed', () => {
			const button = render( <Button isDefault /> ).container.firstChild;
			expect( button ).toHaveClass( 'is-secondary' );

			expect( console ).toHaveWarned();
		} );
	} );
} );
