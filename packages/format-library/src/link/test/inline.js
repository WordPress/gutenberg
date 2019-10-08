/**
 * Internal dependencies
 */
import InlineLinkUI from '../inline';
/**
 * External dependencies
 */
import { shallow } from 'enzyme';

describe( 'InlineLinkUI', () => {
	it( 'InlineLinkUI renders', () => {
		const wrapper = shallow(
			<InlineLinkUI />
		);
		expect( wrapper ).toBeTruthy();
	} );

	it( 'should set state.opensInNewWindow to false by default', () => {
		const wrapper = shallow(
			<InlineLinkUI activeAttributes={ {} } />
		).dive();

		expect( wrapper.state( 'opensInNewWindow' ) ).toEqual( false );
	} );

	it( 'should set state.opensInNewWindow to true if props.activeAttributes.target is _blank', () => {
		const givenProps = {
			addingLink: false,
			activeAttributes: { url: 'http://www.google.com', target: '_blank' },
		};

		const wrapper = shallow(
			<InlineLinkUI activeAttributes={ {} } />
		).dive();
		wrapper.setProps( givenProps );
		expect( wrapper.state( 'opensInNewWindow' ) ).toEqual( true );
	} );
} );
