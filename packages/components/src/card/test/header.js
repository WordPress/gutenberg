/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import CardHeader from '../header';

describe( 'CardHeader', () => {
	describe( 'basic rendering', () => {
		test( 'should have components-card className', () => {
			const wrapper = shallow( <CardHeader /> );
			const cardHeader = wrapper.find( '.components-card-header' );

			expect( cardHeader.length ).toBe( 1 );
		} );

		test( 'should be able to render content', () => {
			const cardHeader = shallow(
				<CardHeader>
					<div className="content">Hello</div>
				</CardHeader>
			);
			const content = cardHeader.find( '.content' );

			expect( content.length ).toBe( 1 );
			expect( content.text() ).toBe( 'Hello' );
		} );
	} );

	describe( 'modifiers', () => {
		test( 'should be able to render size modifier', () => {
			const wrapper = shallow( <CardHeader size="lg" /> );
			const cardHeader = wrapper.find( '.components-card-header' );

			expect( cardHeader.hasClass( 'is-size-lg' ) ).toBe( true );
		} );

		test( 'should be able to render shady modifier', () => {
			const wrapper = shallow( <CardHeader isShady /> );
			const cardHeader = wrapper.find( '.components-card-header' );

			expect( cardHeader.hasClass( 'is-shady' ) ).toBe( true );
		} );

		test( 'should be able to render variant modifier', () => {
			const wrapper = shallow( <CardHeader variant="borderless" /> );
			const cardHeader = wrapper.find( '.components-card-header' );

			expect( cardHeader.hasClass( 'is-variant-borderless' ) ).toBe( true );
		} );
	} );
} );
