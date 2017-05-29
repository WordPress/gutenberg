/**
 * External dependencies
 */
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import FormToggle from '../';

describe( 'FormToggle', () => {
	describe( 'basic rendering', () => {
		it( 'without modifiers', () => {
			const formToggle = shallow( <FormToggle /> );
			expect( formToggle.hasClass( 'components-form-toggle' ) ).to.be.true();
			expect( formToggle.hasClass( 'is-checked' ) ).to.be.false();
			expect( formToggle.type() ).to.equal( 'span' );
			expect( formToggle.find( '.components-form-toggle__input' ).prop( 'value' ) ).to.be.undefined();
			expect( formToggle.find( '.components-form-toggle__hint' ).text() ).to.equal( 'Off' );
			expect( formToggle.find( '.components-form-toggle__hint' ).prop( 'aria-hidden' ) ).to.be.true();
		} );

		it( 'with checked modifier', () => {
			const formToggle = shallow( <FormToggle checked /> );
			expect( formToggle.hasClass( 'is-checked' ) ).to.be.true();
			expect( formToggle.find( '.components-form-toggle__input' ).prop( 'value' ) ).to.be.true();
			expect( formToggle.find( '.components-form-toggle__hint' ).text() ).to.equal( 'On' );
		} );

		it( 'with additonal className', () => {
			const formToggle = shallow( <FormToggle className="testing" /> );
			expect( formToggle.hasClass( 'testing' ) ).to.be.true();
		} );

		it( 'with id property', () => {
			const formToggle = shallow( <FormToggle id="test" /> );
			expect( formToggle.find( '.components-form-toggle__input' ).prop( 'id' ) ).to.equal( 'test' );
		} );

		it( 'with onChange handler', () => {
			let formToggle = shallow( <FormToggle /> );
			let checkBox = formToggle.node.props.children.find( child => 'input' === child.type && 'checkbox' === child.props.type );
			expect( checkBox.props.onChange ).to.equal( noop );

			const testFunction = ( event ) => event;
			formToggle = shallow( <FormToggle onChange={ testFunction } /> );
			checkBox = formToggle.node.props.children.find( child => 'input' === child.type && 'checkbox' === child.props.type );
			expect( checkBox.props.onChange ).to.equal( testFunction );
		} );

		it( 'with showHint false', () => {
			const formToggle = shallow( <FormToggle showHint={ false } /> );

			// When showHint is not provided this element is not rendered.
			expect( formToggle.find( '.components-form-toggle__hint' ).length ).to.equal( 0 );
		} );
	} );
} );
