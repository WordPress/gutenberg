/**
 * WordPress dependencies
 */
import { __experimentalHStack as HStack } from '@wordpress/components';
import { useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import GridItem from './grid-item';

const PAGE_SIZE = 20;

function Pagination( { currentPage, numPages, changePage, totalItems } ) {
	return (
		<HStack className="edit-site-patterns__grid-pagination">
			<div className="edit-site-patterns__grid-pagination-label">
				{
					// translators: %s: Total number of patterns.
					sprintf( __( '%s items' ), totalItems )
				}
			</div>

			<button
				onClick={ () => changePage( 1 ) }
				disabled={ currentPage === 1 }
			>
				«
			</button>
			<button
				onClick={ () => changePage( currentPage - 1 ) }
				disabled={ currentPage === 1 }
			>
				‹
			</button>
			<div className="edit-site-patterns__grid-pagination-label">
				{
					// translators: %1$s: Current page number, %2$s: Total number of pages.
					sprintf( __( '%1$s of %2$s' ), currentPage, numPages )
				}
			</div>
			<button
				onClick={ () => changePage( currentPage + 1 ) }
				disabled={ currentPage === numPages }
			>
				›
			</button>
			<button
				onClick={ () => changePage( numPages ) }
				disabled={ currentPage === numPages }
			>
				»
			</button>
		</HStack>
	);
}

export default function Grid( { categoryId, items, ...props } ) {
	const [ currentPage, setCurrentPage ] = useState( 1 );
	const gridRef = useRef();

	if ( ! items?.length ) {
		return null;
	}
	items.sort( ( a, b ) =>
		a.title.localeCompare( b.title, undefined, {
			numeric: true,
			sensitivity: 'base',
		} )
	);
	const numPages = Math.ceil( items.length / PAGE_SIZE );
	const totalItems = items.length;
	const pageIndex = currentPage - 1;
	const list = items.slice(
		pageIndex * PAGE_SIZE,
		pageIndex * PAGE_SIZE + PAGE_SIZE
	);

	const changePage = ( page ) => {
		const scrollContainer =
			document.getElementsByClassName( 'edit-site-patterns' );

		scrollContainer[ 0 ].scrollTo( 0, 0 );

		setCurrentPage( page );
	};

	return (
		<>
			<Pagination
				{ ...{ currentPage, numPages, changePage, totalItems } }
			/>
			<ul
				role="listbox"
				className="edit-site-patterns__grid"
				{ ...props }
				ref={ gridRef }
			>
				{ list.map( ( item ) => (
					<GridItem
						key={ item.name }
						item={ item }
						categoryId={ categoryId }
					/>
				) ) }
			</ul>
			<Pagination
				{ ...{ currentPage, numPages, changePage, totalItems } }
			/>
		</>
	);
}
