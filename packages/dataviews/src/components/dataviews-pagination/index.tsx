import { Button } from '@wordpress/components';
import { createInterpolateElement, memo, useContext } from '@wordpress/element';
import { sprintf, __, _x, isRTL } from '@wordpress/i18n';
import { next, previous } from '@wordpress/icons';
// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of the new Select, pending WordPress/gutenberg#76135.
import { Select, Stack } from '@wordpress/ui';
import DataViewsContext from '../dataviews-context';
import type { View } from '../../types';

export function hasPaginationControls(
	view: View,
	paginationInfo: { totalItems: number; totalPages: number }
): boolean {
	return (
		! view.infiniteScrollEnabled &&
		paginationInfo.totalItems > 0 &&
		paginationInfo.totalPages > 1
	);
}

export function DataViewsPagination() {
	const { view, onChangeView, paginationInfo } =
		useContext( DataViewsContext );

	if ( ! hasPaginationControls( view, paginationInfo ) ) {
		return null;
	}

	const { totalPages } = paginationInfo;
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
		<Stack
			direction="row"
			className="dataviews-pagination"
			justify="end"
			align="center"
			gap="xl"
		>
			<Stack
				direction="row"
				justify="flex-start"
				align="center"
				gap="xs"
				className="dataviews-pagination__page-select"
			>
				{ createInterpolateElement(
					sprintf(
						// translators: 1: Current page number, 2: Total number of pages.
						_x( '<div>Page</div>%1$s<div>of %2$d</div>', 'paging' ),
						'<CurrentPage />',
						totalPages
					),
					{
						div: <div aria-hidden />,
						// @ts-expect-error — Tag injected via sprintf argument, not visible in format string.
						CurrentPage: (
							<Select.Root
								value={ currentPage.toString() }
								onValueChange={ ( newValue ) => {
									onChangeView( {
										...view,
										page: +newValue,
									} );
								} }
							>
								<Select.Trigger
									size="small"
									variant="minimal"
									aria-label={ __( 'Current page' ) }
								/>
								<Select.Popup width="content">
									{ pageSelectOptions.map( ( option ) => (
										<Select.Item
											key={ option.value }
											value={ option.value }
											size="small"
											aria-label={
												option[ 'aria-label' ]
											}
										>
											<Select.ItemLabel>
												{ option.label }
											</Select.ItemLabel>
										</Select.Item>
									) ) }
								</Select.Popup>
							</Select.Root>
						),
					}
				) }
			</Stack>
			<Stack direction="row" gap="xs" align="center">
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
	);
}

export default memo( DataViewsPagination );
