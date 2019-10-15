/**
 * Internal dependencies
 */
import ModalLinkUI from '../modal';
/**
 * External dependencies
 */
import { shallow } from 'enzyme';

describe( 'LinksUI', () => {
	it( 'LinksUI renders', () => {
		const wrapper = shallow(
			<ModalLinkUI />
		);
		expect( wrapper ).toBeTruthy();
	} );

	it( 'Links are removed when no text is in the URL field', () => {
		// Given
		const onRemove = jest.fn();
		const wrapper = shallow(
			<ModalLinkUI
				onRemove={ onRemove }
				onClose={ jest.fn() }
			/>
		).dive().dive(); // -> dive() removes the HOC layer that was blocking access to ModalLinkUI

		// When

		// Close the BottomSheet
		const bottomSheet = wrapper.find( 'BottomSheet' ).first();
		bottomSheet.simulate( 'close' );

		// Then

		expect( onRemove ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'Links are saved when URL field has content', () => {
		// Given
		const onRemove = jest.fn();
		const wrapper = shallow(
			<ModalLinkUI
				onRemove={ onRemove }
				onClose={ jest.fn() }
			/>
		).dive(); // -> dive() removes the HOC layer that was blocking access to ModalLinkUI

		// Mock `submitLink` for simplicity (we don't want to test submitLink itself here)
		wrapper.instance().submitLink = jest.fn();

		// When

		// Simulate user typing on the URL Cell.
		const bottomSheet = wrapper.dive().find( 'BottomSheet' ).first();
		const cell = bottomSheet.dive().find( 'WithPreferredColorScheme(BottomSheetCell)' ).first().dive();

		cell.simulate( 'changeValue', 'wordpress.com' );

		// Close the BottomSheet
		bottomSheet.simulate( 'close' );

		// Then
		expect( onRemove ).toHaveBeenCalledTimes( 0 );
		expect( wrapper.instance().submitLink ).toHaveBeenCalledTimes( 1 );
	} );
} );
