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
import { chevronRight, chevronLeft, previous, next } from '@wordpress/icons';

function Pagination( {
	view,
	onChangeView,
	paginationInfo: { totalItems = 0, totalPages },
} ) {
	if ( ! totalItems || ! totalPages ) {
		return null;
	}
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
						_n( '%s item', '%s items', totalItems ),
						totalItems
					)
				}
			</Text>
			{ !! totalItems && (
				<HStack expanded={ false } spacing={ 3 }>
					<HStack
						justify="flex-start"
						expanded={ false }
						spacing={ 1 }
					>
						<Button
							onClick={ () =>
								onChangeView( { ...view, page: 1 } )
							}
							disabled={ view.page === 1 }
							label={ __( 'First page' ) }
							icon={ previous }
							showTooltip
							size="compact"
						/>
						<Button
							onClick={ () =>
								onChangeView( { ...view, page: view.page - 1 } )
							}
							disabled={ view.page === 1 }
							label={ __( 'Previous page' ) }
							icon={ chevronLeft }
							showTooltip
							size="compact"
						/>
					</HStack>
					<HStack
						justify="flex-start"
						expanded={ false }
						spacing={ 2 }
					>
						{ createInterpolateElement(
							sprintf(
								// translators: %1$s: Current page number, %2$s: Total number of pages.
								_x( '<CurrenPageControl /> of %2$s', 'paging' ),
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
											if (
												! value ||
												value < 1 ||
												value > totalPages
											) {
												return;
											}
											onChangeView( {
												...view,
												page: value,
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
					<HStack
						justify="flex-start"
						expanded={ false }
						spacing={ 1 }
					>
						<Button
							onClick={ () =>
								onChangeView( { ...view, page: view.page + 1 } )
							}
							disabled={ view.page >= totalPages }
							label={ __( 'Next page' ) }
							icon={ chevronRight }
							showTooltip
							size="compact"
						/>
						<Button
							onClick={ () =>
								onChangeView( { ...view, page: totalPages } )
							}
							disabled={ view.page >= totalPages }
							label={ __( 'Last page' ) }
							icon={ next }
							showTooltip
							size="compact"
						/>
					</HStack>
				</HStack>
			) }
		</HStack>
	);
}

export default Pagination;
