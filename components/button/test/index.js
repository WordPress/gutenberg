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
		it( 'without modifiers', () => {
			const button = shallow( <Button /> );
			expect( button.hasClass( 'components-button' ) ).to.equal( true );
			expect( button.hasClass( 'button' ) ).to.equal( false );
			expect( button.hasClass( 'button-large' ) ).to.equal( false );
			expect( button.hasClass( 'button-primary' ) ).to.equal( false );
			expect( button.hasClass( 'is-toggled' ) ).to.equal( false );
			expect( button.hasClass( 'is-borderless' ) ).to.equal( false );
			expect( button.prop( 'disabled' ) ).to.equal( undefined );
			expect( button.prop( 'type' ) ).to.equal( 'button' );
			expect( button.type() ).to.equal( 'button' );
		} );

		it( 'with isPrimary', () => {
			const button = shallow( <Button isPrimary /> );
			expect( button.hasClass( 'button' ) ).to.equal( true );
			expect( button.hasClass( 'button-large' ) ).to.equal( false );
			expect( button.hasClass( 'button-primary' ) ).to.equal( true );
		} );

		it( 'with isLarge', () => {
			const button = shallow( <Button isLarge /> );
			expect( button.hasClass( 'button' ) ).to.equal( true );
			expect( button.hasClass( 'button-large' ) ).to.equal( true );
			expect( button.hasClass( 'button-primary' ) ).to.equal( false );
		} );

		it( 'with isToggled', () => {
			const button = shallow( <Button isToggled /> );
			expect( button.hasClass( 'button' ) ).to.equal( false );
			expect( button.hasClass( 'is-toggled' ) ).to.equal( true );
		} );

		it( 'with disabled', () => {
			const button = shallow( <Button disabled /> );
			expect( button.prop( 'disabled' ) ).to.equal( true );
		} );

		it( 'does not render target without href present', () => {
			const button = shallow( <Button target="_blank" /> );
			expect( button.prop( 'target' ) ).to.equal( undefined );
		} );
	} );

	describe( 'with href property', () => {
		it( 'renders as a link', () => {
			const button = shallow( <Button href="https://wordpress.org/" /> );

			expect( button.type() ).to.equal( 'a' );
			expect( button.prop( 'href' ) ).to.equal( 'https://wordpress.org/' );
		} );

		it( 'including target renders', () => {
			const button = shallow( <Button href="https://wordpress.org/" target="_blank" /> );

			expect( button.prop( 'target' ) ).to.equal( '_blank' );
		} );

		it( 'will turn it into a button by using disabled property', () => {
			const button = shallow( <Button href="https://wordpress.org/" disabled /> );

			expect( button.type() ).to.equal( 'button' );
		} );
	} );

	describe( 'with className property', () => {
		it( 'renders with an extra className', () => {
			const button = shallow( <Button className="gutenberg" /> );

			expect( button.hasClass( 'gutenberg' ) ).to.equal( true );
		} );
	} );

	describe( 'with additonal properties', () => {
		it( 'renders WordPress property', () => {
			const button = <Button WordPress="awesome" />;

			expect( button.props.WordPress ).to.equal( 'awesome' );
		} );
	} );
} );
