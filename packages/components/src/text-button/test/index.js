/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import TextButton from '../';

jest.mock( '../../button' );

describe( 'TextButton', () => {
	describe( 'basic rendering', () => {
		it( 'should render an top level element with only a class property', () => {
			const textButton = shallow( <TextButton /> );
			expect( textButton.hasClass( 'components-text-button' ) ).toBe( true );
			expect( TextButton.prop( 'aria-label' ) ).toBeUndefined();
		} );

		it( 'should render a Dashicon component matching the wordpress icon', () => {
			const textButton = shallow( <TextButton icon="wordpress" /> );
			expect( textButton.find( 'Dashicon' ).shallow().hasClass( 'dashicons-wordpress' ) ).toBe( true );
		} );

		it( 'should render child elements when passed as children', () => {
			const textButton = shallow( <TextButton children={ <p className="test">Test</p> } /> );
			expect( textButton.find( '.test' ).shallow().text() ).toBe( 'Test' );
		} );

		it( 'should add an aria-label when the label property is used', () => {
			const textButton = shallow( <TextButton label="WordPress">WordPress</TextButton> );
			expect( textButton.name() ).toBe( 'Button' );
			expect( textButton.prop( 'aria-label' ) ).toBe( 'WordPress' );
		} );

		it( 'should add an aria-label when the label property is used, with Tooltip wrapper', () => {
			const textButton = shallow( <TextButton label="WordPress" /> );
			expect( textButton.name() ).toBe( 'Tooltip' );
			expect( textButton.prop( 'text' ) ).toBe( 'WordPress' );
			expect( textButton.find( 'Button' ).prop( 'aria-label' ) ).toBe( 'WordPress' );
		} );

		it( 'should add an additional className', () => {
			const textButton = shallow( <TextButton className="test" /> );
			expect( textButton.hasClass( 'test' ) ).toBe( true );
		} );

		it( 'should add an additonal prop to the TextButton element', () => {
			const textButton = shallow( <TextButton test="test" /> );
			expect( textButton.props().test ).toBe( 'test' );
		} );

		it( 'should allow custom tooltip text', () => {
			const textButton = shallow( <TextButton label="WordPress" tooltip="Custom" /> );
			expect( textButton.name() ).toBe( 'Tooltip' );
			expect( textButton.prop( 'text' ) ).toBe( 'Custom' );
			expect( textButton.find( 'Button' ).prop( 'aria-label' ) ).toBe( 'WordPress' );
		} );

		it( 'should allow tooltip disable', () => {
			const textButton = shallow( <TextButton label="WordPress" tooltip={ false } /> );
			expect( textButton.name() ).toBe( 'Button' );
			expect( textButton.prop( 'aria-label' ) ).toBe( 'WordPress' );
		} );

		it( 'should show the tooltip for empty children', () => {
			const textButton = shallow( <TextButton label="WordPress" children={ [] } /> );
			expect( textButton.name() ).toBe( 'Tooltip' );
			expect( textButton.prop( 'text' ) ).toBe( 'WordPress' );
		} );
	} );
} );
