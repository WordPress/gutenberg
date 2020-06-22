/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import Shortcut from '../';

describe( 'Shortcut', () => {
	it( 'does not render anything if no shortcut prop is provided', () => {
		const wrapper = shallow( <Shortcut /> );

		expect( wrapper.children() ).toHaveLength( 0 );
	} );

	it( 'renders the shortcut display text when a string is passed as the shortcut', () => {
		const wrapper = shallow( <Shortcut shortcut="shortcut text" /> );

		expect( wrapper.text() ).toBe( 'shortcut text' );
	} );

	it( 'renders the shortcut display text and aria-label when an object is passed as the shortcut with the correct properties', () => {
		const wrapper = shallow(
			<Shortcut
				shortcut={ {
					display: 'shortcut text',
					ariaLabel: 'shortcut label',
				} }
			/>
		);

		expect( wrapper.text() ).toBe( 'shortcut text' );
		expect( wrapper.prop( 'aria-label' ) ).toBe( 'shortcut label' );
	} );
} );
