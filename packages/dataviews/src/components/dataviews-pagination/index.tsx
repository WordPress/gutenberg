/**
 * WordPress dependencies
 */
import {
	Button,
	__experimentalHStack as HStack,
	SelectControl,
} from '@wordpress/components';
import { createInterpolateElement, memo, useContext } from '@wordpress/element';
import { sprintf, __, _x } from '@wordpress/i18n';
import { next, previous } from '@wordpress/icons';

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
						label={ __( 'Page:' ) }
						labelPosition="side"
						value={ view.page?.toString() }
						options={ Array.from( Array( totalPages ) ).map(
							( _, i ) => {
								const page = i + 1;
								return {
									value: page.toString(),
									label: sprintf(
										// translators: 1: Current page number, 2: Total number of pages
										__( '%1$s of %2$s' ),
										page.toString(),
										totalPages
									),
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
