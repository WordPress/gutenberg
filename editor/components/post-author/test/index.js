/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { PostAuthor } from '../';

describe( 'PostAuthor', () => {
	const users = {
		data: [
			{
				id: 1,
				name: 'admin',
				capabilities: {
					level_1: true,
				},
			},
			{
				id: 2,
				name: 'subscriber',
				capabilities: {
					level_0: true,
				},
			},
			{
				id: 3,
				name: 'andrew',
				capabilities: {
					level_1: true,
				},
			},
		],
	};

	const user = {
		data: {
			capabilities: {
				publish_posts: true,
			},
		},
	};

	describe( '#getAuthors()', () => {
		it( 'returns empty array on unknown users', () => {
			const wrapper = shallow( <PostAuthor users={ {} } user={ user } /> );

			const authors = wrapper.instance().getAuthors();

			expect( authors ).toEqual( [] );
		} );

		it( 'filters users to authors', () => {
			const wrapper = shallow( <PostAuthor users={ users } user={ user } /> );

			const authors = wrapper.instance().getAuthors();

			expect( authors.map( ( author ) => author.id ).sort() ).toEqual( [ 1, 3 ] );
		} );
	} );

	describe( '#render()', () => {
		it( 'should update author', () => {
			const onUpdateAuthor = jest.fn();
			const wrapper = shallow(
				<PostAuthor
					users={ users }
					user={ user }
					onUpdateAuthor={ onUpdateAuthor } />
			);

			wrapper.find( 'select' ).simulate( 'change', {
				target: {
					value: '3',
				},
			} );

			expect( onUpdateAuthor ).toHaveBeenCalledWith( 3 );
		} );
	} );
} );
