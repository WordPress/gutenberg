/**
 * External dependencies
 */
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
			expect( formToggle.hasClass( 'components-form-toggle' ) ).toBe( true );
			expect( formToggle.hasClass( 'is-checked' ) ).toBe( false );
			expect( formToggle.type() ).toBe( 'span' );
			expect( formToggle.find( '.components-form-toggle__input' ).prop( 'checked' ) ).toBeUndefined();
			expect( formToggle.find( '.components-form-toggle__hint' ).text() ).toBe( 'Off' );
			expect( formToggle.find( '.components-form-toggle__hint' ).prop( 'aria-hidden' ) ).toBe( true );
		} );

		it( 'should render a checked checkbox and change the accessibility text to On when providing checked prop', () => {
			const formToggle = shallow( <FormToggle checked /> );
			expect( formToggle.hasClass( 'is-checked' ) ).toBe( true );
			expect( formToggle.find( '.components-form-toggle__input' ).prop( 'checked' ) ).toBe( true );
			expect( formToggle.find( '.components-form-toggle__hint' ).text() ).toBe( 'On' );
		} );

		it( 'should render with an additional className', () => {
			const formToggle = shallow( <FormToggle className="testing" /> );
			expect( formToggle.hasClass( 'testing' ) ).toBe( true );
		} );

		it( 'should render an id prop for the input checkbox', () => {
			const formToggle = shallow( <FormToggle id="test" /> );
			expect( formToggle.find( '.components-form-toggle__input' ).prop( 'id' ) ).toBe( 'test' );
		} );

		it( 'should render a checkbox with a noop onChange', () => {
			const formToggle = shallow( <FormToggle /> );
			const checkBox = formToggle.prop( 'children' ).find( child => 'input' === child.type && 'checkbox' === child.props.type );
			expect( checkBox.props.onChange ).toBe( noop );
		} );

		it( 'should render a checkbox with a user-provided onChange', () => {
			const testFunction = ( event ) => event;
			const formToggle = shallow( <FormToggle onChange={ testFunction } /> );
			const checkBox = formToggle.prop( 'children' ).find( child => 'input' === child.type && 'checkbox' === child.props.type );
			expect( checkBox.props.onChange ).toBe( testFunction );
		} );

		it( 'should not render the hint when showHint is set to false', () => {
			const formToggle = shallow( <FormToggle showHint={ false } /> );

			// When showHint is not provided this element is not rendered.
			expect( formToggle.find( '.components-form-toggle__hint' ).exists() ).toBe( false );
		} );
	} );
} );
