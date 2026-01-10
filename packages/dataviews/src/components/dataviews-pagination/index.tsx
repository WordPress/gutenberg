/**
 * WordPress dependencies
 */
import { Button, SelectControl } from '@wordpress/components';
import { createInterpolateElement, memo, useContext } from '@wordpress/element';
import { sprintf, __, _x, isRTL } from '@wordpress/i18n';
import { next, previous } from '@wordpress/icons';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import DataViewsContext from '../dataviews-context';

export function DataViewsPagination() {
	const {
		view,
		onChangeView,
		paginationInfo: { totalItems = 0, totalPages },
	} = useContext( DataViewsContext );

	if ( ! totalItems || ! totalPages || view.infiniteScrollEnabled ) {
		return null;
	}

	const currentPage = view.page ?? 1;
	const pageSelectOptions = Array.from( Array( totalPages ) ).map(
		( _, i ) => {
			const page = i + 1;
			return {
				value: page.toString(),
				label: page.toString(),
				'aria-label':
					currentPage === page
						? sprintf(
								// translators: 1: current page number. 2: total number of pages.
								__( 'Page %1$d of %2$d' ),
								currentPage,
								totalPages
						  )
						: page.toString(),
			};
		}
	);

	return (
		!! totalItems &&
		totalPages !== 1 && (
			<Stack
				direction="row"
				className="dataviews-pagination"
				justify="end"
				align="center"
				gap="lg"
			>
				<Stack
					direction="row"
					justify="flex-start"
					align="center"
					gap="2xs"
					className="dataviews-pagination__page-select"
				>
					{ createInterpolateElement(
						sprintf(
							// translators: 1: Current page number, 2: Total number of pages.
							_x(
								'<div>Page</div>%1$s<div>of %2$d</div>',
								'paging'
							),
							'<CurrentPage />',
							totalPages
						),
						{
							div: <div aria-hidden />,
							CurrentPage: (
								<SelectControl
									aria-label={ __( 'Current page' ) }
									value={ currentPage.toString() }
									options={ pageSelectOptions }
									onChange={ ( newValue ) => {
										onChangeView( {
											...view,
											page: +newValue,
										} );
									} }
									size="small"
									variant="minimal"
								/>
							),
						}
					) }
				</Stack>
				<Stack direction="row" gap="2xs" align="center">
					<Button
						onClick={ () =>
							onChangeView( {
								...view,
								page: currentPage - 1,
							} )
						}
						disabled={ currentPage === 1 }
						accessibleWhenDisabled
						label={ __( 'Previous page' ) }
						icon={ isRTL() ? next : previous }
						showTooltip
						size="compact"
						tooltipPosition="top"
					/>
					<Button
						onClick={ () =>
							onChangeView( { ...view, page: currentPage + 1 } )
						}
						disabled={ currentPage >= totalPages }
						accessibleWhenDisabled
						label={ __( 'Next page' ) }
						icon={ isRTL() ? previous : next }
						showTooltip
						size="compact"
						tooltipPosition="top"
					/>
				</Stack>
			</Stack>
		)
	);
}

export default memo( DataViewsPagination );
