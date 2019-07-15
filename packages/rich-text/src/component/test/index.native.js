/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { RichText } from '../index';

describe( 'RichText Native', () => {
	let richText;

	beforeEach( () => {
		richText = new RichText( { multiline: false } );
	} );

	describe( 'willTrimSpaces', () => {
		it( 'exists', () => {
			expect( richText ).toHaveProperty( 'willTrimSpaces' );
		} );

		it( 'is a function', () => {
			expect( richText.willTrimSpaces ).toBeInstanceOf( Function );
		} );

		it( 'reports false for styled text with no outer spaces', () => {
			const html = '<p><b>Hello</b> <strong>Hello</strong> WorldWorld!</p>';
			expect( richText.willTrimSpaces( html ) ).toBe( false );
		} );
	} );

	describe( 'Adds new line on Enter', () => {
		let newValue;
		const wrapper = shallow( <RichText
			rootTagsToEliminate={ [ 'p' ] }
			value=""
			onChange={ ( value ) => {
				newValue = value;
			} }
			formatTypes={ [] }
			onSelectionChange={ jest.fn() }
		/> );

		const event = {
			nativeEvent: {
				eventCount: 0,
			},
		};
		wrapper.instance().onEnter( event );

		it( ' Adds <br> tag to content after pressing Enter key', () => {
			expect( newValue ).toEqual( '<br>' );
		} );
	} );
} );
