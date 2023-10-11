/**
 * WordPress dependencies
 */
import {
	Button,
	__experimentalHStack as HStack,
	__experimentalText as Text,
	__experimentalNumberControl as NumberControl,
} from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { sprintf, __, _x, _n } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { PageSizeControl } from './view-actions';

// For now this is copied from the patterns list Pagination component, because
// the datatable pagination starts from index zero(`0`). Eventually all lists will be
// using this one.
export function Pagination( {
	dataView,
	// If passed, use it, as it's for controlled pagination.
	totalItems = 0,
} ) {
	const currentPage = dataView.getState().pagination.pageIndex + 1;
	const numPages = dataView.getPageCount();
	const _totalItems = totalItems || dataView.getCoreRowModel().rows.length;
	return (
		<HStack
			expanded={ false }
			spacing={ 3 }
			justify="space-between"
			className="dataviews-pagination"
		>
			<Text variant="muted">
				{
					// translators: %s: Total number of entries.
					sprintf(
						// translators: %s: Total number of entries.
						_n( '%s item', '%s items', _totalItems ),
						_totalItems
					)
				}
			</Text>
			{ !! _totalItems && (
				<HStack expanded={ false } spacing={ 1 }>
					<Button
						variant="tertiary"
						onClick={ () => dataView.setPageIndex( 0 ) }
						disabled={ ! dataView.getCanPreviousPage() }
						aria-label={ __( 'First page' ) }
					>
						«
					</Button>
					<Button
						variant="tertiary"
						onClick={ () => dataView.previousPage() }
						disabled={ ! dataView.getCanPreviousPage() }
						aria-label={ __( 'Previous page' ) }
					>
						‹
					</Button>
					<HStack
						justify="flex-start"
						expanded={ false }
						spacing={ 1 }
					>
						{ createInterpolateElement(
							sprintf(
								// translators: %1$s: Current page number, %2$s: Total number of pages.
								_x( '<CurrenPageControl /> of %2$s', 'paging' ),
								currentPage,
								numPages
							),
							{
								CurrenPageControl: (
									<NumberControl
										aria-label={ __( 'Current page' ) }
										min={ 1 }
										max={ numPages }
										onChange={ ( value ) => {
											if ( value > numPages ) return;
											dataView.setPageIndex( value - 1 );
										} }
										step="1"
										value={ currentPage }
										isDragEnabled={ false }
										spinControls="none"
									/>
								),
							}
						) }
					</HStack>
					<Button
						variant="tertiary"
						onClick={ () => dataView.nextPage() }
						disabled={ ! dataView.getCanNextPage() }
						aria-label={ __( 'Next page' ) }
					>
						›
					</Button>
					<Button
						variant="tertiary"
						onClick={ () =>
							dataView.setPageIndex( dataView.getPageCount() - 1 )
						}
						disabled={ ! dataView.getCanNextPage() }
						aria-label={ __( 'Last page' ) }
					>
						»
					</Button>
				</HStack>
			) }
			<PageSizeControl dataView={ dataView } />
		</HStack>
	);
}
