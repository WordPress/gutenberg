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
		it( 'should render a span element with an unchecked checkbox', () => {
			const formToggle = shallow( <FormToggle /> );
			expect( formToggle.hasClass( 'components-form-toggle' ) ).to.be.true();
			expect( formToggle.hasClass( 'is-checked' ) ).to.be.false();
			expect( formToggle.type() ).to.equal( 'span' );
			expect( formToggle.find( '.components-form-toggle__input' ).prop( 'value' ) ).to.be.undefined();
			expect( formToggle.find( '.components-form-toggle__hint' ).text() ).to.equal( 'Off' );
			expect( formToggle.find( '.components-form-toggle__hint' ).prop( 'aria-hidden' ) ).to.be.true();
		} );

		it( 'should render a checked checkbox and change the accessability text to On when providing checked prop', () => {
			const formToggle = shallow( <FormToggle checked /> );
			expect( formToggle.hasClass( 'is-checked' ) ).to.be.true();
			expect( formToggle.find( '.components-form-toggle__input' ).prop( 'value' ) ).to.be.true();
			expect( formToggle.find( '.components-form-toggle__hint' ).text() ).to.equal( 'On' );
		} );

		it( 'shouuld render with an additional className', () => {
			const formToggle = shallow( <FormToggle className="testing" /> );
			expect( formToggle.hasClass( 'testing' ) ).to.be.true();
		} );

		it( 'should render an id prop for the input checkbox', () => {
			const formToggle = shallow( <FormToggle id="test" /> );
			expect( formToggle.find( '.components-form-toggle__input' ).prop( 'id' ) ).to.equal( 'test' );
		} );

		it( 'should render a checkbox with a noop on change and if an onChange function is provided override the noop', () => {
			let formToggle = shallow( <FormToggle /> );
			let checkBox = formToggle.prop( 'children' ).find( child => 'input' === child.type && 'checkbox' === child.props.type );
			expect( checkBox.props.onChange ).to.equal( noop );

			const testFunction = ( event ) => event;
			formToggle = shallow( <FormToggle onChange={ testFunction } /> );
			checkBox = formToggle.prop( 'children' ).find( child => 'input' === child.type && 'checkbox' === child.props.type );
			expect( checkBox.props.onChange ).to.equal( testFunction );
		} );

		it( 'should not render the hint when showHint is set to false', () => {
			const formToggle = shallow( <FormToggle showHint={ false } /> );

			// When showHint is not provided this element is not rendered.
			expect( formToggle.find( '.components-form-toggle__hint' ).exists() ).to.be.false();
		} );
	} );
} );
