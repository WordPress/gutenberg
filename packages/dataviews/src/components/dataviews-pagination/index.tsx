/**
 * WordPress dependencies
 */
import {
	Button,
	__experimentalHStack as HStack,
	SelectControl,
} from '@wordpress/components';
import { memo, useContext } from '@wordpress/element';
import { sprintf, __, _x } from '@wordpress/i18n';
import { Icon, next, previous, chevronDownSmall } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import DataViewsContext from '../dataviews-context';

function DataViewsPagination() {
	const {
		view,
		onChangeView,
		paginationInfo: { totalItems = 0, totalPages },
	} = useContext( DataViewsContext );
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
					spacing={ 0 }
					className="dataviews-pagination__page-selection"
				>
					<SelectControl
						aria-label={ __( 'Current page' ) }
						value={ view.page?.toString() }
						options={ Array.from( Array( totalPages ) ).map(
							( _, i ) => {
								const page = i + 1;
								return {
									value: page.toString(),
									label: page.toString(),
								};
							}
						) }
						onChange={ ( newValue ) => {
							onChangeView( {
								...view,
								page: +newValue,
							} );
						} }
						size="compact"
						__nextHasNoMarginBottom
						variant="minimal"
						suffix={
							<span className="dataviews-pagination__page-selection-suffix">
								{ sprintf(
									// translators: Total number of pages
									__( 'of %s pages' ),
									totalPages
								) }
								<Icon icon={ chevronDownSmall } />
							</span>
						}
					/>
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
						accessibleWhenDisabled
						label={ __( 'Previous page' ) }
						icon={ previous }
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
						icon={ next }
						showTooltip
						size="compact"
						tooltipPosition="top"
					/>
				</HStack>
			</HStack>
		)
	);
}

export default memo( DataViewsPagination );
