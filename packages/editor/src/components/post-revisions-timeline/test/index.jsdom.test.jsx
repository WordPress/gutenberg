import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useSelect, useDispatch } from '@wordpress/data';
import { createElement } from '@wordpress/element';
import PostRevisionsTimeline from '../';

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useSelect: vi.fn(),
	useDispatch: vi.fn(),
} ) );

vi.mock( import( '@wordpress/fields' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	authorField: {
		id: 'author',
		label: 'Author',
		getValue: ( { item } ) => item?._embedded?.author?.[ 0 ]?.name,
		render: ( { item } ) => {
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

vi.mock( import( '@wordpress/dataviews' ), async ( importOriginal ) => {
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
		...( await importOriginal() ),
		DataViewsPicker,
		filterSortAndPaginate: ( data ) => ( {
			data,
			paginationInfo: { totalItems: data.length },
		} ),
	};
} );

vi.mock( import( '../../../lock-unlock' ), () => ( {
	unlock: ( object ) => {
		return {
			...object,
			registerPrivateActions: vi.fn(),
			registerPrivateSelectors: vi.fn(),
		};
	},
} ) );

vi.mock( import( '../../post-content-information' ), () => ( {
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

		getCurrentRevision = vi.fn( () => revisions[ 0 ] );

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
		useDispatch.mockReturnValue( { setCurrentRevisionId: vi.fn() } );
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
