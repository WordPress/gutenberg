/**
 * External dependencies
 */
import { expect } from 'chai';
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import Button from '../';

describe( 'Button', () => {
	describe( 'basic rendering', () => {
		it( 'should render a button element with only one class', () => {
			const button = shallow( <Button /> );
			expect( button.hasClass( 'components-button' ) ).to.be.true();
			expect( button.hasClass( 'button' ) ).to.be.false();
			expect( button.hasClass( 'button-large' ) ).to.be.false();
			expect( button.hasClass( 'button-primary' ) ).to.be.false();
			expect( button.hasClass( 'is-toggled' ) ).to.be.false();
			expect( button.hasClass( 'is-borderless' ) ).to.be.false();
			expect( button.prop( 'disabled' ) ).to.be.undefined();
			expect( button.prop( 'type' ) ).to.equal( 'button' );
			expect( button.type() ).to.equal( 'button' );
		} );

		it( 'should render a button element with button-primary class', () => {
			const button = shallow( <Button isPrimary /> );
			expect( button.hasClass( 'button' ) ).to.be.true();
			expect( button.hasClass( 'button-large' ) ).to.be.false();
			expect( button.hasClass( 'button-primary' ) ).to.be.true();
		} );

		it( 'should render a button element with button-large class', () => {
			const button = shallow( <Button isLarge /> );
			expect( button.hasClass( 'button' ) ).to.be.true();
			expect( button.hasClass( 'button-large' ) ).to.be.true();
			expect( button.hasClass( 'button-primary' ) ).to.be.false();
		} );

		it( 'should render a button element with is-toggled without button class', () => {
			const button = shallow( <Button isToggled /> );
			expect( button.hasClass( 'button' ) ).to.be.false();
			expect( button.hasClass( 'is-toggled' ) ).to.be.true();
		} );

		it( 'should add a disabled prop to the button', () => {
			const button = shallow( <Button disabled /> );
			expect( button.prop( 'disabled' ) ).to.be.true();
		} );

		it( 'should not poss the prop target into the element', () => {
			const button = shallow( <Button target="_blank" /> );
			expect( button.prop( 'target' ) ).to.be.undefined();
		} );

		it( 'should render with an additional className', () => {
			const button = shallow( <Button className="gutenberg" /> );

			expect( button.hasClass( 'gutenberg' ) ).to.be.true();
		} );

		it( 'should render and additional WordPress prop of value awesome', () => {
			const button = <Button WordPress="awesome" />;

			expect( button.props.WordPress ).to.equal( 'awesome' );
		} );
	} );

	describe( 'with href property', () => {
		it( 'should render a link instead of a button with href prop', () => {
			const button = shallow( <Button href="https://wordpress.org/" /> );

			expect( button.type() ).to.equal( 'a' );
			expect( button.prop( 'href' ) ).to.equal( 'https://wordpress.org/' );
		} );

		it( 'should allow for the passing of the target prop when a link is created', () => {
			const button = shallow( <Button href="https://wordpress.org/" target="_blank" /> );

			expect( button.prop( 'target' ) ).to.equal( '_blank' );
		} );

		it( 'should become a button again when disabled is supplied', () => {
			const button = shallow( <Button href="https://wordpress.org/" disabled /> );

			expect( button.type() ).to.equal( 'button' );
		} );
	} );
} );
