/**
 * Internal dependencies
 */
import userCompleter from '../user';

describe( 'user', () => {
	describe( 'getOptionLabel', () => {
		it( 'should return user details fragment', () => {
			const user = {
				name: 'Smithers Jones',
				slug: 'userSlug',
				avatar_urls: { 24: 'http://my.avatar' },
			};
			const userLabel = userCompleter.getOptionLabel( user );
			expect( userLabel[ 0 ] ).toEqual(
				<img
					key="avatar"
					className="editor-autocompleters__user-avatar"
					alt=""
					src="http://my.avatar"
				/>
			);
			expect( userLabel[ 1 ] ).toEqual(
				<span key="name" className="editor-autocompleters__user-name">
					Smithers Jones
				</span>
			);
			expect( userLabel[ 2 ] ).toEqual(
				<span key="slug" className="editor-autocompleters__user-slug">
					userSlug
				</span>
			);
		} );
		it( 'should return user details fragment without default avatar dashicon if avatar_urls array not set', () => {
			const user = {
				name: 'Smithers Jones',
				slug: 'userSlug',
			};
			const userLabel = userCompleter.getOptionLabel( user );
			expect( userLabel[ 0 ] ).toEqual(
				<span className="editor-autocompleters__no-avatar"></span>
			);
			expect( userLabel[ 1 ] ).toEqual(
				<span key="name" className="editor-autocompleters__user-name">
					Smithers Jones
				</span>
			);
			expect( userLabel[ 2 ] ).toEqual(
				<span key="slug" className="editor-autocompleters__user-slug">
					userSlug
				</span>
			);
		} );
	} );
} );
