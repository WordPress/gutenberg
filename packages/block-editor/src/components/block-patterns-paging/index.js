/**
 * WordPress dependencies
 */
import {
	__experimentalVStack as VStack,
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
		<VStack className="block-editor-patterns__grid-pagination-wrapper">
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

			{ numPages > 1 && (
				<HStack
					expanded={ false }
					spacing={ 3 }
					justify="flex-start"
					className="block-editor-patterns__grid-pagination"
				>
					<HStack
						expanded={ false }
						spacing={ 1 }
						className="block-editor-patterns__grid-pagination-previous"
					>
						<Button
							variant="tertiary"
							onClick={ () => changePage( 1 ) }
							disabled={ currentPage === 1 }
							aria-label={ __( 'First page' ) }
							__experimentalIsFocusable
						>
							<span>«</span>
						</Button>
						<Button
							variant="tertiary"
							onClick={ () => changePage( currentPage - 1 ) }
							disabled={ currentPage === 1 }
							aria-label={ __( 'Previous page' ) }
							__experimentalIsFocusable
						>
							<span>‹</span>
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
					<HStack
						expanded={ false }
						spacing={ 1 }
						className="block-editor-patterns__grid-pagination-next"
					>
						<Button
							variant="tertiary"
							onClick={ () => changePage( currentPage + 1 ) }
							disabled={ currentPage === numPages }
							aria-label={ __( 'Next page' ) }
							__experimentalIsFocusable
						>
							<span>›</span>
						</Button>
						<Button
							variant="tertiary"
							onClick={ () => changePage( numPages ) }
							disabled={ currentPage === numPages }
							aria-label={ __( 'Last page' ) }
							size="default"
							__experimentalIsFocusable
						>
							<span>»</span>
						</Button>
					</HStack>
				</HStack>
			) }
		</VStack>
	);
}
