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
					modified="2017-08-03T15:05:50"
				/>
			);

			const previewWindow = { location: {} };

			wrapper.instance().previewWindow = previewWindow;

			wrapper.setProps( { previewLink: 'https://wordpress.org/?p=1' } );

			expect( previewWindow.location ).toBe(
				'https://wordpress.org/?p=1'
			);
		} );
	} );

	describe( 'openPreviewWindow()', () => {
		let windowOpen;
		beforeEach( () => {
			windowOpen = window.open;
		} );
		afterEach( () => {
			window.open = windowOpen;
		} );

		it( 'behaves like a regular link if not autosaveable', () => {
			const preventDefault = jest.fn();
			const autosave = jest.fn();
			const setLocation = jest.fn();
			window.open = jest.fn( () => ( {
				focus: jest.fn(),
				set location( url ) {
					setLocation( url );
				},
			} ) );

			const wrapper = shallow(
				<PostPreviewButton postId={ 1 } autosave={ autosave } />
			);

			wrapper.simulate( 'click', {
				preventDefault,
				target: { href: 'https://wordpress.org/?p=1' },
			} );

			expect( preventDefault ).toHaveBeenCalled();
			expect( window.open ).toHaveBeenCalledWith( '', 'wp-preview-1' );
			expect( wrapper.instance().previewWindow.focus ).toHaveBeenCalled();
			expect( autosave ).not.toHaveBeenCalled();
			expect( setLocation ).toHaveBeenCalledWith(
				'https://wordpress.org/?p=1'
			);
		} );

		it( 'autosaves the post if autosaveable', () => {
			const preventDefault = jest.fn();
			const autosave = jest.fn();

			window.open = jest.fn( () => ( {
				focus: jest.fn(),
				document: {
					write: jest.fn(),
					close: jest.fn(),
				},
			} ) );

			const wrapper = shallow(
				<PostPreviewButton
					postId={ 1 }
					autosave={ autosave }
					isAutosaveable
				/>
			);

			wrapper.simulate( 'click', { preventDefault } );

			expect( preventDefault ).toHaveBeenCalled();
			expect( window.open ).toHaveBeenCalledWith( '', 'wp-preview-1' );
			expect( wrapper.instance().previewWindow.focus ).toHaveBeenCalled();
			expect( autosave ).toHaveBeenCalled();
			expect(
				wrapper.instance().previewWindow.document.write.mock
					.calls[ 0 ][ 0 ]
			).toContain( 'Generating preview…' );
			expect(
				wrapper.instance().previewWindow.document.close
			).toHaveBeenCalled();
		} );
	} );

	describe( 'render()', () => {
		it( 'should render previewLink if provided', () => {
			const wrapper = shallow(
				<PostPreviewButton
					postId={ 1 }
					isSaveable
					previewLink="https://wordpress.org/?p=1&preview=true"
					currentPostLink="https://wordpress.org/?p=1"
				/>
			);

			expect( wrapper ).toMatchSnapshot();
		} );

		it( 'should render currentPostLink otherwise', () => {
			const wrapper = shallow(
				<PostPreviewButton
					postId={ 1 }
					isSaveable
					currentPostLink="https://wordpress.org/?p=1"
				/>
			);

			expect( wrapper ).toMatchSnapshot();
		} );

		it( 'should be disabled if post is not saveable', () => {
			const wrapper = shallow(
				<PostPreviewButton
					postId={ 1 }
					currentPostLink="https://wordpress.org/?p=1"
				/>
			);

			expect( wrapper.prop( 'disabled' ) ).toBe( true );
		} );
	} );
} );
