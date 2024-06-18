/**
 * WordPress dependencies
 */
import {
	Button,
	__experimentalHStack as HStack,
	SelectControl,
} from '@wordpress/components';
import { createInterpolateElement, memo } from '@wordpress/element';
import { sprintf, __, _x } from '@wordpress/i18n';
import { chevronRight, chevronLeft } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import type { View } from './types';

interface PaginationProps {
	view: View;
	onChangeView: ( view: View ) => void;
	paginationInfo: {
		totalItems: number;
		totalPages: number;
	};
}

const Pagination = memo( function Pagination( {
	view,
	onChangeView,
	paginationInfo: { totalItems = 0, totalPages },
}: PaginationProps ) {
	if ( ! totalItems || ! totalPages ) {
		return null;
	}
	const currentPage = view.page ?? 1;
	return (
		!! totalItems &&
		totalPages !== 1 && (
			<HStack
				expanded={ false }
				spacing={ 6 }
				justify="end"
				className="dataviews-pagination"
			>
				<HStack
					justify="flex-start"
					expanded={ false }
					spacing={ 2 }
					className="dataviews-pagination__page-selection"
				>
					{ createInterpolateElement(
						sprintf(
							// translators: %s: Total number of pages.
							_x( 'Page <CurrentPageControl /> of %s', 'paging' ),
							totalPages
						),
						{
							CurrentPageControl: (
								<SelectControl
									aria-label={ __( 'Current page' ) }
									value={ view.page?.toString() }
									options={ Array.from(
										Array( totalPages )
									).map( ( _, i ) => {
										const page = i + 1;
										return {
											value: page.toString(),
											label: page.toString(),
										};
									} ) }
									onChange={ ( newValue ) => {
										onChangeView( {
											...view,
											page: +newValue,
										} );
									} }
									size="compact"
									__nextHasNoMarginBottom
								/>
							),
						}
					) }
				</HStack>
				<HStack expanded={ false } spacing={ 1 }>
					<Button
						onClick={ () =>
							onChangeView( {
								...view,
								page: currentPage - 1,
							} )
						}
						disabled={ currentPage === 1 }
						__experimentalIsFocusable
						label={ __( 'Previous page' ) }
						icon={ chevronLeft }
						showTooltip
						size="compact"
						tooltipPosition="top"
					/>
					<Button
						onClick={ () =>
							onChangeView( { ...view, page: currentPage + 1 } )
						}
						disabled={ currentPage >= totalPages }
						__experimentalIsFocusable
						label={ __( 'Next page' ) }
						icon={ chevronRight }
						showTooltip
						size="compact"
						tooltipPosition="top"
					/>
				</HStack>
			</HStack>
		)
	);
} );

export default Pagination;
