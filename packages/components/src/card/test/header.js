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
			const cardHeader = wrapper.find( '.components-card__header' );

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
			const wrapper = shallow( <CardHeader size="large" /> );
			const cardHeader = wrapper.find( '.components-card__header' );

			expect( cardHeader.hasClass( 'is-size-large' ) ).toBe( true );
		} );

		test( 'should be able to render shady modifier', () => {
			const wrapper = shallow( <CardHeader isShady /> );
			const cardHeader = wrapper.find( '.components-card__header' );

			expect( cardHeader.hasClass( 'is-shady' ) ).toBe( true );
		} );

		test( 'should be able to render borderless modifier', () => {
			const wrapper = shallow( <CardHeader isBorderless /> );
			const cardHeader = wrapper.find( '.components-card__header' );

			expect( cardHeader.hasClass( 'is-borderless' ) ).toBe( true );
		} );
	} );
} );
