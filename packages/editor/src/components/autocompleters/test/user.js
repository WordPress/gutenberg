/**
 * Internal dependencies
 */
import { getUserLabel } from '../user';

describe( 'user', () => {
	describe( 'getUserLabel', () => {
		it( 'should return user details fragment', () => {
			const user = {
				name: 'Smithers Jones',
				slug: 'userSlug',
				avatar_urls: { 24: 'http://my.avatar' },
			};
			const userLabel = getUserLabel( user );
			expect( userLabel ).toEqual(
				<>
					<img
						className="editor-autocompleters__user-avatar"
						alt=""
						src="http://my.avatar"
					/>
					<span className="editor-autocompleters__user-name">
						Smithers Jones
					</span>
					<span className="editor-autocompleters__user-slug">
						userSlug
					</span>
				</>
			);
		} );
		it( 'should return user details fragment without default avatar dashicon if avatar_urls array not set', () => {
			const user = {
				name: 'Smithers Jones',
				slug: 'userSlug',
			};
			const userLabel = getUserLabel( user );
			expect( userLabel ).toEqual(
				<>
					<span className="editor-autocompleters__no-avatar"></span>
					<span className="editor-autocompleters__user-name">
						Smithers Jones
					</span>
					<span className="editor-autocompleters__user-slug">
						userSlug
					</span>
				</>
			);
		} );
	} );
} );
