import ModalLinkUI from '../../gutenberg/packages/format-library/src/link/modal.native.js'
import { shallow } from 'enzyme';
import sinon from 'sinon';

describe( 'LinksUI', () => {
	it( 'LinksUI renders', () => {
        const wrapper = shallow(
            <ModalLinkUI />
        );
		expect( wrapper ).toBeTruthy();
    } );
    
    it( 'Links are removed when no text is in the URL field', () => {
        const onRemove = jest.fn();

        const wrapper = shallow(
            <ModalLinkUI
                onRemove={ onRemove }
                onClose={ jest.fn() }
            />
        ).dive(); // -> dive() removes the HOC layer that was blocking access to ModalLinkUI

        // Close the BottomSheet
        const bottomSheet = wrapper.find('BottomSheet').first();
        bottomSheet.simulate('close');

        expect( onRemove ).toHaveBeenCalledTimes( 1 );
    })
} );
