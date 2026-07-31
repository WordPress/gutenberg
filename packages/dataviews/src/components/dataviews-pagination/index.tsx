/**
 * WordPress dependencies
 */
import { Button, SelectControl } from '@wordpress/components';
import { createInterpolateElement, memo, useContext } from '@wordpress/element';
import i18n from '@wordpress/dataviews-i18n';
import { isRTL, sprintf } from '@wordpress/i18n';
import { next, previous } from '@wordpress/icons';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
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
						? sprintf( i18n.PAGE_X_OF_Y(), currentPage, totalPages )
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
						i18n.PAGE_X_OF_Y_WITH_INPUT(),
						'<CurrentPage />',
						totalPages
					),
					{
						div: <div aria-hidden />,
						// @ts-expect-error — Tag injected via sprintf argument, not visible in format string.
						CurrentPage: (
							<SelectControl
								aria-label={ i18n.CURRENT_PAGE() }
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
					label={ i18n.PREVIOUS_PAGE() }
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
					label={ i18n.NEXT_PAGE() }
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
