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

	describe( '#getAuthors()', () => {
		it( 'returns empty array on unknown users', () => {
			const wrapper = shallow( <PostAuthor users={ {} } /> );

			const authors = wrapper.instance().getAuthors();

			expect( authors ).toEqual( [] );
		} );

		it( 'filters users to authors', () => {
			const wrapper = shallow( <PostAuthor users={ users } /> );

			const authors = wrapper.instance().getAuthors();

			expect( authors.map( ( author ) => author.id ).sort() ).toEqual( [ 1, 3 ] );
		} );
	} );

	describe( '#render()', () => {
		it( 'should not render anything if users unknown', () => {
			const wrapper = shallow( <PostAuthor users={ {} } /> );

			expect( wrapper.type() ).toBe( null );
		} );

		it( 'should not render anything if single user', () => {
			const wrapper = shallow(
				<PostAuthor users={ { data: users.data.slice( 0, 1 ) } } />
			);

			expect( wrapper.type() ).toBe( null );
		} );

		it( 'should not render anything if single filtered user', () => {
			const wrapper = shallow(
				<PostAuthor users={ { data: users.data.slice( 0, 2 ) } } />
			);

			expect( wrapper.type() ).toBe( null );
		} );

		it( 'should render select control', () => {
			const wrapper = shallow( <PostAuthor users={ users } /> );

			expect( wrapper.find( 'select' ).length ).not.toBe( 0 );
		} );

		it( 'should update author', () => {
			const onUpdateAuthor = jest.fn();
			const wrapper = shallow(
				<PostAuthor
					users={ users }
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
