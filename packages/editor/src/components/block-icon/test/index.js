/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockIcon from '../';

describe( 'BlockIcon', () => {
	it( 'renders nothing when icon omitted', () => {
		const wrapper = shallow( <BlockIcon /> );

		expect( wrapper.type() ).toBeNull();
	} );

	it( 'renders a dashicon by slug', () => {
		const wrapper = shallow( <BlockIcon icon="format-image" /> );

		expect( wrapper.find( 'Dashicon' ).prop( 'icon' ) ).toBe( 'format-image' );
	} );

	it( 'renders a function', () => {
		const wrapper = shallow( <BlockIcon icon={ () => <span /> } /> );

		expect( wrapper.childAt( 0 ).name() ).toBe( 'span' );
	} );

	it( 'renders an element', () => {
		const wrapper = shallow( <BlockIcon icon={ <span /> } /> );

		expect( wrapper.childAt( 0 ).name() ).toBe( 'span' );
	} );

	it( 'renders a component', () => {
		class MyComponent extends Component {
			render() {
				return <span />;
			}
		}
		const wrapper = shallow(
			<BlockIcon icon={ MyComponent } />
		);

		expect( wrapper.childAt( 0 ).name() ).toBe( 'MyComponent' );
	} );
} );
