/**
 * External dependencies
 */
import { shallow } from 'enzyme';
import TestUtils from 'react-dom/test-utils';
/**
 * WordPress dependencies
 */
import { createRef } from '@wordpress/element';
import { plusCircle } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import ButtonWithForwardedRef, { Button } from '../';
import VisuallyHidden from '../../visually-hidden';

describe( 'Button', () => {
	describe( 'basic rendering', () => {
		it( 'should render a button element with only one class', () => {
			const button = shallow( <Button /> ).find( 'button' );
			expect( button.hasClass( 'components-button' ) ).toBe( true );
			expect( button.hasClass( 'is-large' ) ).toBe( false );
			expect( button.hasClass( 'is-primary' ) ).toBe( false );
			expect( button.hasClass( 'is-pressed' ) ).toBe( false );
			expect( button.prop( 'disabled' ) ).toBeUndefined();
			expect( button.prop( 'aria-disabled' ) ).toBeUndefined();
			expect( button.prop( 'type' ) ).toBe( 'button' );
			expect( button.type() ).toBe( 'button' );
		} );

		it( 'should render a button element with is-primary class', () => {
			const button = shallow( <Button variant="primary" /> ).find(
				'button'
			);
			expect( button.hasClass( 'is-large' ) ).toBe( false );
			expect( button.hasClass( 'is-primary' ) ).toBe( true );
		} );

		it( 'should render a button element with is-secondary and is-small class', () => {
			const button = shallow(
				<Button variant="secondary" isSmall />
			).find( 'button' );
			expect( button.hasClass( 'is-secondary' ) ).toBe( true );
			expect( button.hasClass( 'is-large' ) ).toBe( false );
			expect( button.hasClass( 'is-small' ) ).toBe( true );
			expect( button.hasClass( 'is-primary' ) ).toBe( false );
		} );

		it( 'should render a button element with is-tertiary class', () => {
			const button = shallow( <Button variant="tertiary" /> ).find(
				'button'
			);
			expect( button.hasClass( 'is-large' ) ).toBe( false );
			expect( button.hasClass( 'is-primary' ) ).toBe( false );
			expect( button.hasClass( 'is-secondary' ) ).toBe( false );
			expect( button.hasClass( 'is-tertiary' ) ).toBe( true );
		} );

		it( 'should render a button element with is-link class', () => {
			const button = shallow( <Button variant="link" /> ).find(
				'button'
			);
			expect( button.hasClass( 'is-primary' ) ).toBe( false );
			expect( button.hasClass( 'is-secondary' ) ).toBe( false );
			expect( button.hasClass( 'is-tertiary' ) ).toBe( false );
			expect( button.hasClass( 'is-link' ) ).toBe( true );
		} );

		it( 'should render a button element with is-pressed without button class', () => {
			const button = shallow( <Button isPressed /> ).find( 'button' );
			expect( button.hasClass( 'is-pressed' ) ).toBe( true );
		} );

		it( 'should add a disabled prop to the button', () => {
			const button = shallow( <Button disabled /> ).find( 'button' );
			expect( button.prop( 'disabled' ) ).toBe( true );
		} );

		it( 'should add only aria-disabled attribute when disabled and isFocusable are true', () => {
			const button = shallow(
				<Button disabled __experimentalIsFocusable />
			).find( 'button' );
			expect( button.prop( 'disabled' ) ).toBe( false );
			expect( button.prop( 'aria-disabled' ) ).toBe( true );
		} );

		it( 'should not poss the prop target into the element', () => {
			const button = shallow( <Button target="_blank" /> ).find(
				'button'
			);
			expect( button.prop( 'target' ) ).toBeUndefined();
		} );

		it( 'should render with an additional className', () => {
			const button = shallow( <Button className="gutenberg" /> ).find(
				'button'
			);

			expect( button.hasClass( 'gutenberg' ) ).toBe( true );
		} );

		it( 'should render and additional WordPress prop of value awesome', () => {
			const button = shallow( <Button WordPress="awesome" /> ).find(
				'button'
			);

			expect( button.prop( 'WordPress' ) ).toBe( 'awesome' );
		} );

		it( 'should render an icon button', () => {
			const iconButton = shallow( <Button icon={ plusCircle } /> ).find(
				'button'
			);
			expect( iconButton.hasClass( 'has-icon' ) ).toBe( true );
			expect( iconButton.prop( 'aria-label' ) ).toBeUndefined();
		} );

		it( 'should render a Dashicon component matching the wordpress icon', () => {
			const iconButton = shallow( <Button icon={ plusCircle } /> ).find(
				'button'
			);
			expect( iconButton.find( 'Icon' ).dive() ).not.toBeNull();
		} );

		it( 'should render child elements and icon', () => {
			const iconButton = shallow(
				<Button
					icon={ plusCircle }
					children={ <p className="test">Test</p> }
				/>
			).find( 'button' );
			expect( iconButton.find( 'Icon' ).dive() ).not.toBeNull();
			expect( iconButton.find( '.test' ).shallow().text() ).toBe(
				'Test'
			);
		} );

		it( 'should add an aria-label when the label property is used, with Tooltip wrapper', () => {
			const iconButton = shallow(
				<Button icon={ plusCircle } label="WordPress" />
			).find( 'Tooltip' );
			expect( iconButton.name() ).toBe( 'Tooltip' );
			expect( iconButton.prop( 'text' ) ).toBe( 'WordPress' );
			expect( iconButton.find( 'button' ).prop( 'aria-label' ) ).toBe(
				'WordPress'
			);
		} );

		it( 'should support explicit aria-label override', () => {
			const iconButton = shallow( <Button aria-label="Custom" /> ).find(
				'button'
			);
			expect( iconButton.prop( 'aria-label' ) ).toBe( 'Custom' );
		} );

		it( 'should support adding aria-describedby text', () => {
			const buttonDescription = shallow(
				<Button describedBy="Description text" />
			)
				.find( VisuallyHidden )
				.shallow()
				.text();
			expect( buttonDescription ).toBe( 'Description text' );
		} );

		it( 'should populate tooltip with describedBy content', () => {
			const buttonTooltip = shallow(
				<Button
					describedBy="Description text"
					label="Label"
					icon={ plusCircle }
				/>
			).find( 'Tooltip' );

			expect( buttonTooltip.prop( 'text' ) ).toBe( 'Description text' );
		} );

		it( 'should allow tooltip disable', () => {
			const iconButton = shallow(
				<Button
					icon={ plusCircle }
					label="WordPress"
					showTooltip={ false }
				/>
			).find( 'button' );
			expect( iconButton.name() ).toBe( 'button' );
			expect( iconButton.prop( 'aria-label' ) ).toBe( 'WordPress' );
		} );

		it( 'should show the tooltip for empty children', () => {
			const iconButton = shallow(
				<Button icon={ plusCircle } label="WordPress" children={ [] } />
			).find( 'Tooltip' );
			expect( iconButton.name() ).toBe( 'Tooltip' );
			expect( iconButton.prop( 'text' ) ).toBe( 'WordPress' );
		} );

		it( 'should not show the tooltip when icon and children defined', () => {
			const iconButton = shallow(
				<Button icon={ plusCircle } label="WordPress">
					Children
				</Button>
			).find( 'button' );
			expect( iconButton.name() ).toBe( 'button' );
		} );

		it( 'should force showing the tooltip even if icon and children defined', () => {
			const iconButton = shallow(
				<Button icon={ plusCircle } label="WordPress" showTooltip>
					Children
				</Button>
			).find( 'Tooltip' );
			expect( iconButton.name() ).toBe( 'Tooltip' );
		} );
	} );

	describe( 'with href property', () => {
		it( 'should render a link instead of a button with href prop', () => {
			const button = shallow(
				<Button href="https://wordpress.org/" />
			).find( 'a' );

			expect( button.type() ).toBe( 'a' );
			expect( button.prop( 'href' ) ).toBe( 'https://wordpress.org/' );
		} );

		it( 'should allow for the passing of the target prop when a link is created', () => {
			const button = shallow(
				<Button href="https://wordpress.org/" target="_blank" />
			).find( 'a' );

			expect( button.prop( 'target' ) ).toBe( '_blank' );
		} );

		it( 'should become a button again when disabled is supplied', () => {
			const button = shallow(
				<Button href="https://wordpress.org/" disabled />
			).find( 'button' );

			expect( button.type() ).toBe( 'button' );
		} );
	} );

	describe( 'ref forwarding', () => {
		it( 'should enable access to DOM element', () => {
			const ref = createRef();

			TestUtils.renderIntoDocument(
				<ButtonWithForwardedRef ref={ ref } />
			);
			expect( ref.current.type ).toBe( 'button' );
		} );
	} );

	describe( 'deprecated props', () => {
		it( 'should not break when the legacy isPrimary prop is passed', () => {
			const button = shallow( <Button isPrimary /> ).find( 'button' );
			expect( button.hasClass( 'is-primary' ) ).toBe( true );
		} );

		it( 'should not break when the legacy isSecondary prop is passed', () => {
			const button = shallow( <Button isSecondary /> ).find( 'button' );
			expect( button.hasClass( 'is-secondary' ) ).toBe( true );
		} );

		it( 'should not break when the legacy isTertiary prop is passed', () => {
			const button = shallow( <Button isTertiary /> ).find( 'button' );
			expect( button.hasClass( 'is-tertiary' ) ).toBe( true );
		} );

		it( 'should not break when the legacy isLink prop is passed', () => {
			const button = shallow( <Button isLink /> ).find( 'button' );
			expect( button.hasClass( 'is-link' ) ).toBe( true );
		} );

		it( 'should warn when the isDefault prop is passed', () => {
			const button = shallow( <Button isDefault /> ).find( 'button' );
			expect( button.hasClass( 'is-secondary' ) ).toBe( true );

			expect( console ).toHaveWarned();
		} );
	} );
} );
