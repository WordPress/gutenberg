/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PostRevisionsTimeline from '../';

jest.mock( '@wordpress/data/src/components/use-select', () => jest.fn() );
jest.mock( '@wordpress/data/src/components/use-dispatch', () => ( {
	useDispatch: jest.fn(),
} ) );

jest.mock( '@wordpress/fields', () => ( {
	authorField: {
		id: 'author',
		label: 'Author',
		getValue: ( { item } ) => item?._embedded?.author?.[ 0 ]?.name,
		render: ( { item } ) => {
			const { createElement } = require( '@wordpress/element' );
			const authorName = item?._embedded?.author?.[ 0 ]?.name;

			return createElement(
				'span',
				null,
				createElement(
					'span',
					{ 'aria-hidden': 'true' },
					'Author icon'
				),
				createElement( 'span', null, authorName )
			);
		},
	},
} ) );

jest.mock( '@wordpress/dataviews', () => {
	const DataViewsPicker = ( { data, fields, getItemId, selection } ) => {
		const titleField = fields.find( ( field ) => field.id === 'date' );

		return (
			<div>
				{ data.map( ( item ) => (
					<div
						key={ getItemId( item ) }
						role="option"
						aria-label={ titleField.getValue( { item } ) }
						aria-selected={ selection.includes(
							getItemId( item )
						) }
					>
						{ fields.map( ( field ) => {
							const normalizedField = {
								id: field.id,
								label: field.label,
								render: field.render,
							};

							return normalizedField.render ? (
								<div key={ normalizedField.id }>
									<normalizedField.render
										item={ item }
										field={ normalizedField }
									/>
								</div>
							) : null;
						} ) }
					</div>
				) ) }
			</div>
		);
	};
	DataViewsPicker.Layout = () => null;
	DataViewsPicker.Footer = () => null;

	return {
		DataViewsPicker,
		filterSortAndPaginate: ( data ) => ( {
			data,
			paginationInfo: { totalItems: data.length },
		} ),
	};
} );

jest.mock( '../../../lock-unlock', () => ( {
	unlock: ( object ) => {
		return {
			...object,
			registerPrivateActions: jest.fn(),
			registerPrivateSelectors: jest.fn(),
		};
	},
} ) );

jest.mock( '../../post-content-information', () => ( {
	PostContentInformationUI: () => null,
} ) );

describe( 'PostRevisionsTimeline', () => {
	let getCurrentRevision;

	beforeEach( () => {
		const revisions = [
			{
				id: 3,
				date: '2026-07-07T12:00:00',
				author: 1,
				slug: '10-autosave-v1',
				content: { raw: 'Autosaved content' },
				_embedded: { author: [ { id: 1, name: 'Alice' } ] },
			},
			{
				id: 2,
				date: '2026-07-07T11:00:00',
				author: 2,
				slug: '10-revision-v1',
				content: { raw: 'Current revision content' },
				_embedded: { author: [ { id: 2, name: 'Bob' } ] },
			},
			{
				id: 1,
				date: '2026-07-07T10:00:00',
				author: 1,
				slug: '10-revision-v1',
				content: { raw: 'Older revision content' },
				_embedded: { author: [ { id: 1, name: 'Alice' } ] },
			},
		];
		const users = {
			1: { name: 'Alice' },
			2: { name: 'Bob' },
		};

		getCurrentRevision = jest.fn( () => revisions[ 0 ] );

		useSelect.mockImplementation( ( mapSelect ) =>
			mapSelect( () => ( {
				getCurrentPostType: () => 'post',
				getCurrentRevisionId: () => 3,
				getCurrentRevision,
				getRevisionPage: () => 1,
				getPageRevisions: () => revisions,
				getCurrentPostLastRevisionId: () => 2,
				getEntityConfig: () => ( { revisionKey: 'id' } ),
				getEntityRecord: ( _kind, _name, id ) => users[ id ],
			} ) )
		);
		useDispatch.mockReturnValue( { setCurrentRevisionId: jest.fn() } );
	} );

	it( 'keeps the author field intact and labels autosaves', () => {
		render( <PostRevisionsTimeline /> );

		expect( screen.getAllByText( 'Author icon' ) ).toHaveLength( 3 );
		expect( screen.getAllByText( 'Alice' ) ).toHaveLength( 2 );
		expect( screen.getByText( 'Bob' ) ).toBeVisible();
		expect( screen.getByText( 'Autosave' ) ).toBeVisible();
		expect( screen.getAllByRole( 'option' )[ 0 ] ).toHaveAccessibleName(
			/Autosave/
		);
		expect( screen.getAllByRole( 'option' )[ 1 ] ).not.toHaveAccessibleName(
			/Autosave/
		);
		expect( screen.queryByText( 'Current' ) ).not.toBeInTheDocument();
		expect(
			screen.queryByText( 'Revision by Alice' )
		).not.toBeInTheDocument();
		expect(
			screen.queryByText( 'Current Revision by Bob' )
		).not.toBeInTheDocument();
		expect( getCurrentRevision ).not.toHaveBeenCalled();
	} );
} );
