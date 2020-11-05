/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import RawHTML from '../raw-html';

describe( 'RawHTML', () => {
	it( 'is dangerous', () => {
		const html = '<p>So scary!</p>';
		const element = shallow( <RawHTML>{ html }</RawHTML> );

		expect( element.type() ).toBe( 'div' );
		expect( element.prop( 'dangerouslySetInnerHTML' ).__html ).toBe( html );
		expect( element.prop( 'children' ) ).toBe( undefined );
	} );

	it( 'creates wrapper if assigned other props', () => {
		const html = '<p>So scary!</p>';
		const element = shallow( <RawHTML className="foo">{ html }</RawHTML> );

		expect( element.type() ).toBe( 'div' );
		expect( element.prop( 'className' ) ).toBe( 'foo' );
		expect( element.prop( 'dangerouslySetInnerHTML' ).__html ).toBe( html );
		expect( element.prop( 'children' ) ).toBe( undefined );
	} );
} );
