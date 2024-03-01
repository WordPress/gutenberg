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
	const isFirstPage = currentPage === 1;
	const isLastPage = currentPage === numPages;

	// Buttons in this component use `tabIndex={ 0 }` to workaround a Safari bug not
	// setting focus on buttons when clicking them. See https://github.com/WordPress/gutenberg/pull/56162
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
							onClick={
								isFirstPage ? undefined : () => changePage( 1 )
							}
							aria-disabled={ isFirstPage }
							aria-label={ __( 'First page' ) }
							tabIndex={ 0 }
						>
							<span>«</span>
						</Button>
						<Button
							variant="tertiary"
							onClick={
								isFirstPage
									? undefined
									: () => changePage( currentPage - 1 )
							}
							aria-disabled={ isFirstPage }
							aria-label={ __( 'Previous page' ) }
							tabIndex={ 0 }
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
							onClick={
								isLastPage
									? undefined
									: () => changePage( currentPage + 1 )
							}
							aria-disabled={ isLastPage }
							aria-label={ __( 'Next page' ) }
							tabIndex={ 0 }
						>
							<span>›</span>
						</Button>
						<Button
							variant="tertiary"
							onClick={
								isLastPage
									? undefined
									: () => changePage( numPages )
							}
							aria-disabled={ isLastPage }
							aria-label={ __( 'Last page' ) }
							size="default"
							tabIndex={ 0 }
						>
							<span>»</span>
						</Button>
					</HStack>
				</HStack>
			) }
		</VStack>
	);
}
