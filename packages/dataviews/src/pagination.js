/**
 * WordPress dependencies
 */
import {
	Button,
	__experimentalHStack as HStack,
	__experimentalNumberControl as NumberControl,
} from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { sprintf, __, _x } from '@wordpress/i18n';
import { chevronRight, chevronLeft } from '@wordpress/icons';

function Pagination( {
	view,
	onChangeView,
	paginationInfo: { totalItems = 0, totalPages },
} ) {
	if ( ! totalItems || ! totalPages ) {
		return null;
	}
	return (
		!! totalItems &&
		totalPages !== 1 && (
			<HStack
				expanded={ false }
				spacing={ 3 }
				justify="space-between"
				className="dataviews-pagination"
			>
				<HStack justify="flex-start" expanded={ false } spacing={ 2 }>
					{ createInterpolateElement(
						sprintf(
							// translators: %1$s: Current page number, %2$s: Total number of pages.
							_x(
								'Page <CurrenPageControl /> of %2$s',
								'paging'
							),
							view.page,
							totalPages
						),
						{
							CurrenPageControl: (
								<NumberControl
									aria-label={ __( 'Current page' ) }
									min={ 1 }
									max={ totalPages }
									onChange={ ( value ) => {
										const _value = +value;
										if (
											! _value ||
											_value < 1 ||
											_value > totalPages
										) {
											return;
										}
										onChangeView( {
											...view,
											page: _value,
										} );
									} }
									step="1"
									value={ view.page }
									isDragEnabled={ false }
									spinControls="none"
								/>
							),
						}
					) }
				</HStack>
				<HStack expanded={ false } spacing={ 1 }>
					<Button
						onClick={ () =>
							onChangeView( { ...view, page: view.page - 1 } )
						}
						disabled={ view.page === 1 }
						__experimentalIsFocusable
						label={ __( 'Previous page' ) }
						icon={ chevronLeft }
						showTooltip
						size="compact"
						tooltipPosition="top"
					/>
					<Button
						onClick={ () =>
							onChangeView( { ...view, page: view.page + 1 } )
						}
						disabled={ view.page >= totalPages }
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
}

export default Pagination;
