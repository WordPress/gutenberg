/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { PostAuthor } from '../';

describe( 'PostAuthor', () => {
	describe( 'With a small number of authors', () => {
		const authors = [
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
		];

		const user = {
			data: {
				capabilities: {
					publish_posts: true,
				},
			},
		};

		const postAuthor = [
			{
				id: 1,
				name: 'admin',
			},
		];

		describe( '#render()', () => {
			it( 'should render select dropdown', () => {
				const wrapper = shallow(
					<PostAuthor
						authors={ authors }
						user={ user }
						postAuthor={ postAuthor }
					/>
				);
				expect( wrapper.find( 'select' ) ).toHaveLength( 1 );
				expect( wrapper.find( 'select option' ) ).toHaveLength( 3 );
			} );

			it( 'should update author', () => {
				const onUpdateAuthor = jest.fn();
				const wrapper = shallow(
					<PostAuthor
						authors={ authors }
						user={ user }
						onUpdateAuthor={ onUpdateAuthor }
						postAuthor={ postAuthor }
					/>
				);

				wrapper.find( 'select' ).simulate( 'change', {
					target: {
						value: '3',
					},
				} );

				expect( onUpdateAuthor ).toHaveBeenCalledWith( 3 );
			} );

			it( 'renders all authors when < 99', () => {
				const lotsOfAuthors = [ ...Array( 98 ) ].map( ( empty, index ) => {
					const id = index + 1;
					return {
						id,
						name: `user-${ id }`,
						capabilities: {
							level_1: true,
						},
					};
				} );
				const wrapper = shallow(
					<PostAuthor
						authors={ lotsOfAuthors }
						user={ user }
						postAuthor={ { id: 1, name: 'user-1' } }
					/>
				);
				expect( wrapper.find( 'select' ) ).toHaveLength( 1 );
				expect( wrapper.find( 'select option' ) ).toHaveLength( 98 );
			} );
		} );
	} );
	describe( 'With many authors', () => {
		const user = {
			data: {
				capabilities: {
					publish_posts: true,
				},
			},
		};
		describe( '#render()', () => {
			it( 'should render autocomplete when authors >= 99', () => {
				const lotsOfAuthors = [ ...Array( 99 ) ].map( ( empty, index ) => {
					const id = index + 1;
					return {
						id,
						name: `user-${ id }`,
						capabilities: id % 2 === 1 ? { level_1: true } : { level_0: true },
					};
				} );
				const wrapper = shallow(
					<PostAuthor
						authors={ lotsOfAuthors }
						user={ user }
						postAuthor={ { id: 1, name: 'user-1' } }
					/>
				);
				expect( wrapper.find( 'select' ) ).toHaveLength( 0 );
			} );
		} );
	} );
} );
