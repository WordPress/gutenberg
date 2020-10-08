/**
 * External dependencies
 */
import { shallow } from 'enzyme';
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import FormToggle from '../';
import { StyledToggleInput } from '../styles/form-toggle-styles';

describe( 'FormToggle', () => {
	describe( 'basic rendering', () => {
		it( 'should render a span element with an unchecked checkbox', () => {
			const formToggle = shallow( <FormToggle /> );
			expect( formToggle.hasClass( 'components-form-toggle' ) ).toBe(
				true
			);
			expect( formToggle.hasClass( 'is-checked' ) ).toBe( false );
			expect( formToggle.type().__emotion_base ).toBe( 'span' );
		} );

		it( 'should render a checked checkbox and change the accessibility text to On when providing checked prop', () => {
			const formToggle = shallow( <FormToggle checked /> );
			expect( formToggle.hasClass( 'is-checked' ) ).toBe( true );
			expect(
				formToggle.find( StyledToggleInput ).prop( 'checked' )
			).toBe( true );
		} );

		it( 'should render with an additional className', () => {
			const formToggle = shallow( <FormToggle className="testing" /> );
			expect( formToggle.hasClass( 'testing' ) ).toBe( true );
		} );

		it( 'should render an id prop for the input checkbox', () => {
			// Disabled because of our rule restricting literal IDs, preferring
			// `withInstanceId`. In this case, it's fine to use literal IDs.
			// eslint-disable-next-line no-restricted-syntax
			const formToggle = shallow( <FormToggle id="test" /> );
			expect( formToggle.find( StyledToggleInput ).prop( 'id' ) ).toBe(
				'test'
			);
		} );

		it( 'should render a checkbox with a noop onChange', () => {
			const formToggle = shallow( <FormToggle /> );
			expect( formToggle ).toMatchSnapshot();

			expect(
				formToggle.find( StyledToggleInput ).prop( 'onChange' )
			).toBe( noop );
		} );

		it( 'should render a checkbox with a user-provided onChange', () => {
			const testFunction = ( event ) => event;
			const formToggle = shallow(
				<FormToggle onChange={ testFunction } />
			);
			expect( formToggle ).toMatchSnapshot();

			expect(
				formToggle.find( StyledToggleInput ).prop( 'onChange' )
			).toBe( testFunction );
		} );
	} );
} );
