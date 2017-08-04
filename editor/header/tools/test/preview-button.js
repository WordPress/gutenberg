/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { PreviewButton } from '../preview-button';

describe( 'PreviewButton', () => {
	describe( 'constructor()', () => {
		it( 'should initialize with non-awaiting-save', () => {
			const instance = new PreviewButton( {} );

			expect( instance.state.isAwaitingSave ).toBe( false );
		} );
	} );

	describe( 'getWindowTarget()', () => {
		it( 'returns a string unique to the post id', () => {
			const instance = new PreviewButton( {
				postId: 1,
			} );

			expect( instance.getWindowTarget() ).toBe( 'wp-preview-1' );
		} );
	} );

	describe( 'componentDidUpdate()', () => {
		it( 'should change popup location if save finishes', () => {
			const wrapper = shallow(
				<PreviewButton
					postId={ 1 }
					link="https://wordpress.org/?p=1"
					modified="2017-08-03T15:05:50" />
			);
			wrapper.instance().previewWindow = {};
			wrapper.setState( { isAwaitingSave: true } );

			wrapper.setProps( { modified: '2017-08-03T15:05:52' } );

			expect(
				wrapper.instance().previewWindow.location
			).toBe( 'https://wordpress.org/?p=1' );
			expect( wrapper.state( 'isAwaitingSave' ) ).toBe( false );
		} );
	} );

	describe( 'saveForPreview()', () => {
		it( 'should do nothing if not dirty', () => {
			const autosave = jest.fn();
			const preventDefault = jest.fn();
			const windowOpen = window.open;
			window.open = jest.fn();

			const wrapper = shallow(
				<PreviewButton
					postId={ 1 }
					isDirty={ false }
					autosave={ autosave } />
			);

			wrapper.simulate( 'click', { preventDefault } );

			expect( autosave ).not.toHaveBeenCalled();
			expect( preventDefault ).not.toHaveBeenCalled();
			expect( wrapper.state( 'isAwaitingSave' ) ).not.toBe( true );
			expect( window.open ).not.toHaveBeenCalled();

			window.open = windowOpen;
		} );

		it( 'should open a popup window', () => {
			const autosave = jest.fn();
			const preventDefault = jest.fn();
			const windowOpen = window.open;
			window.open = jest.fn();

			const wrapper = shallow(
				<PreviewButton
					postId={ 1 }
					isDirty
					autosave={ autosave } />
			);

			wrapper.simulate( 'click', { preventDefault } );

			expect( autosave ).toHaveBeenCalled();
			expect( preventDefault ).toHaveBeenCalled();
			expect( wrapper.state( 'isAwaitingSave' ) ).toBe( true );
			expect( window.open ).toHaveBeenCalledWith( 'about:blank', 'wp-preview-1' );

			window.open = windowOpen;
		} );
	} );

	describe( 'render()', () => {
		it( 'should render a link', () => {
			const wrapper = shallow(
				<PreviewButton
					postId={ 1 }
					link="https://wordpress.org/?p=1" />
			);

			expect( wrapper.prop( 'href' ) ).toBe( 'https://wordpress.org/?p=1' );
			expect( wrapper.prop( 'target' ) ).toBe( 'wp-preview-1' );
		} );
	} );
} );
