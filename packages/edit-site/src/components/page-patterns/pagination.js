/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalText as Text,
	Button,
} from '@wordpress/components';
import { __, _x, _n, sprintf } from '@wordpress/i18n';

export default function Pagination( {
	currentPage,
	numPages,
	changePage,
	totalItems,
} ) {
	return (
		<HStack
			expanded={ false }
			spacing={ 3 }
			justify="flex-start"
			className="edit-site-patterns__grid-pagination"
		>
			<Text variant="muted">
				{
					// translators: %s: Total number of patterns.
					sprintf(
						// translators: %s: Total number of patterns.
						_n( '%s item', '%s items', totalItems ),
						totalItems
					)
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
				{ sprintf(
					// translators: %1$s: Current page number, %2$s: Total number of pages.
					_x( '%1$s of %2$s', 'paging' ),
					currentPage,
					numPages
				) }
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
