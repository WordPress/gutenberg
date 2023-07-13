/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalText as Text,
	Button,
} from '@wordpress/components';
import { useRef, useState, useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useAsyncList } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import GridItem from './grid-item';

const PAGE_SIZE = 20;

function Pagination( { currentPage, numPages, changePage, totalItems } ) {
	return (
		<HStack
			expanded={ false }
			spacing={ 3 }
			className="edit-site-patterns__grid-pagination"
		>
			<Text variant="muted">
				{
					// translators: %s: Total number of patterns.
					sprintf( __( '%s items' ), totalItems )
				}
			</Text>
			<HStack expanded={ false } spacing={ 1 }>
				<Button
					variant="tertiary"
					onClick={ () => changePage( 1 ) }
					disabled={ currentPage === 1 }
					aria-label={ __( 'First page' ) }
				>
					«
				</Button>
				<Button
					variant="tertiary"
					onClick={ () => changePage( currentPage - 1 ) }
					disabled={ currentPage === 1 }
					aria-label={ __( 'Previous page' ) }
				>
					‹
				</Button>
			</HStack>
			<Text variant="muted">
				{
					// translators: %1$s: Current page number, %2$s: Total number of pages.
					sprintf( __( '%1$s of %2$s' ), currentPage, numPages )
				}
			</Text>
			<HStack expanded={ false } spacing={ 1 }>
				<Button
					variant="tertiary"
					onClick={ () => changePage( currentPage + 1 ) }
					disabled={ currentPage === numPages }
					aria-label={ __( 'Next page' ) }
				>
					›
				</Button>
				<Button
					variant="tertiary"
					onClick={ () => changePage( numPages ) }
					disabled={ currentPage === numPages }
					aria-label={ __( 'Last page' ) }
				>
					»
				</Button>
			</HStack>
		</HStack>
	);
}

export default function Grid( { categoryId, items, ...props } ) {
	const [ currentPage, setCurrentPage ] = useState( 1 );
	const gridRef = useRef();
	const totalItems = items.length;
	const pageIndex = currentPage - 1;

	const list = useMemo(
		() =>
			items.slice(
				pageIndex * PAGE_SIZE,
				pageIndex * PAGE_SIZE + PAGE_SIZE
			),
		[ pageIndex, items ]
	);

	const asyncList = useAsyncList( list, { step: 10 } );

	if ( ! list?.length ) {
		return null;
	}

	const numPages = Math.ceil( items.length / PAGE_SIZE );
	const changePage = ( page ) => {
		const scrollContainer =
			document.getElementsByClassName( 'edit-site-patterns' );

		scrollContainer[ 0 ].scrollTo( 0, 0 );

		setCurrentPage( page );
	};

	return (
		<>
			<ul
				role="listbox"
				className="edit-site-patterns__grid"
				{ ...props }
				ref={ gridRef }
			>
				{ asyncList.map( ( item ) => (
					<GridItem
						key={ item.name }
						item={ item }
						categoryId={ categoryId }
					/>
				) ) }
			</ul>
			{ numPages > 1 && (
				<Pagination
					{ ...{ currentPage, numPages, changePage, totalItems } }
				/>
			) }
		</>
	);
}
