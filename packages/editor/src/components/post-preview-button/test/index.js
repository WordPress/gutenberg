/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { PostPreviewButton } from '../';

describe( 'PostPreviewButton', () => {
	describe( 'setPreviewWindowLink()', () => {
		it( 'should do nothing if there is no preview window', () => {
			const url = 'https://wordpress.org';
			const setter = jest.fn();
			const wrapper = shallow( <PostPreviewButton /> );

			wrapper.instance().setPreviewWindowLink( url );

			expect( setter ).not.toHaveBeenCalled();
		} );

		it( 'set preview window location to url', () => {
			const url = 'https://wordpress.org';
			const setter = jest.fn();
			const wrapper = shallow( <PostPreviewButton /> );
			wrapper.instance().previewWindow = {
				get location() {
					return {
						href: 'about:blank',
					};
				},
				set location( value ) {
					setter( value );
				},
			};

			wrapper.instance().setPreviewWindowLink( url );

			expect( setter ).toHaveBeenCalledWith( url );
		} );
	} );

	describe( 'getWindowTarget()', () => {
		it( 'returns a string unique to the post id', () => {
			const instance = new PostPreviewButton( {
				postId: 1,
			} );

			expect( instance.getWindowTarget() ).toBe( 'wp-preview-1' );
		} );
	} );

	describe( 'componentDidUpdate()', () => {
		it( 'should change popup location if preview link is available', () => {
			const wrapper = shallow(
				<PostPreviewButton
					postId={ 1 }
					currentPostLink="https://wordpress.org/?p=1"
					isSaveable
					modified="2017-08-03T15:05:50" />
			);

			const previewWindow = { location: {} };

			wrapper.instance().previewWindow = previewWindow;

			wrapper.setProps( { previewLink: 'https://wordpress.org/?p=1' } );

			expect( previewWindow.location ).toBe( 'https://wordpress.org/?p=1' );
		} );
	} );

	describe( 'openPreviewOverlay()', () => {
		it( 'behaves like a regular link if not autosaveable', () => {
			const autosave = jest.fn();

			const wrapper = shallow(
				<PostPreviewButton
					postId={ 1 }
					autosave={ autosave }
				/>
			);

			wrapper.instance().openPreviewOverlay();

			expect( autosave ).not.toHaveBeenCalled();
		} );

		it( 'autosaves the post if autosaveable', () => {
			const autosave = jest.fn();

			const wrapper = shallow(
				<PostPreviewButton
					postId={ 1 }
					autosave={ autosave }
					isAutosaveable
				/>
			);

			wrapper.instance().openPreviewOverlay();

			expect( autosave ).toHaveBeenCalled();
		} );
	} );

	describe( 'openPreviewInNewTab()', () => {
		let windowOpen;
		beforeEach( () => {
			windowOpen = window.open;
		} );
		afterEach( () => {
			window.open = windowOpen;
		} );

		it( 'opens preview in new tab', () => {
			const preventDefault = jest.fn();
			const setLocation = jest.fn();
			window.open = jest.fn( () => ( {
				focus: jest.fn(),
				set location( url ) {
					setLocation( url );
				},
			} ) );

			const wrapper = shallow(
				<PostPreviewButton
					postId={ 1 }
				/>
			);

			wrapper.instance().openPreviewInNewTab( {
				preventDefault,
				target: { href: 'https://wordpress.org/?p=1' },
			} );

			expect( preventDefault ).toHaveBeenCalled();
			expect( window.open ).toHaveBeenCalledWith( '', '_blank' );
			expect( wrapper.instance().previewWindow.focus ).toHaveBeenCalled();
			expect( setLocation ).toHaveBeenCalledWith( 'https://wordpress.org/?p=1' );
		} );
	} );

	describe( 'render()', () => {
		const previewLink = 'https://wordpress.org/?p=1&preview=true';
		const currentPostLink = 'https://wordpress.org/?p=1';
		it( 'should render overlay when state is open', () => {
			const wrapper = shallow(
				<PostPreviewButton
					postId={ 1 }
					currentPostLink={ currentPostLink }
				/>
			).setState( { isPreviewOpen: true } );

			expect( wrapper ).toMatchSnapshot();
		} );

		it( 'should render previewLink if provided', () => {
			const wrapper = shallow(
				<PostPreviewButton
					postId={ 1 }
					isSaveable
					previewLink={ previewLink }
					currentPostLink={ currentPostLink }
				/>
			).setState( { isPreviewOpen: true } );

			const frameSrc = wrapper.find( '.editor-block-preview__frame' ).prop( 'src' );
			expect( frameSrc ).toEqual( previewLink );
		} );

		it( 'should render currentPostLink otherwise', () => {
			const wrapper = shallow(
				<PostPreviewButton
					postId={ 1 }
					isSaveable
					currentPostLink={ currentPostLink }
				/>
			).setState( { isPreviewOpen: true } );

			const frameSrc = wrapper.find( '.editor-block-preview__frame' ).prop( 'src' );
			expect( frameSrc ).toEqual( currentPostLink );
		} );

		it( 'should be disabled if post is not saveable', () => {
			const wrapper = shallow(
				<PostPreviewButton
					postId={ 1 }
					currentPostLink="https://wordpress.org/?p=1"
				/>
			).find( '.editor-post-preview' );

			expect( wrapper.prop( 'disabled' ) ).toBe( true );
		} );
	} );
} );
