/**
 * WordPress dependencies
 */
import {
	Button,
	__experimentalHStack as HStack,
	__experimentalText as Text,
	__experimentalNumberControl as NumberControl,
	__experimentalInputControlPrefixWrapper as InputControlPrefixWrapper,
	SelectControl,
} from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { sprintf, __, _x, _n } from '@wordpress/i18n';

const PAGE_SIZE_VALUES = [ 5, 20, 50 ];
function PageSizeControl( { view, onChangeView } ) {
	const label = __( 'Rows per page:' );
	return (
		<SelectControl
			__nextHasNoMarginBottom
			label={ label }
			hideLabelFromVision
			// TODO: This should probably use a label based on the wanted design
			// and we could remove InputControlPrefixWrapper usage.
			prefix={
				<InputControlPrefixWrapper
					as="span"
					className="dataviews__select-control-prefix"
				>
					{ label }
				</InputControlPrefixWrapper>
			}
			value={ view.perPage }
			options={ PAGE_SIZE_VALUES.map( ( pageSize ) => ( {
				value: pageSize,
				label: pageSize,
			} ) ) }
			onChange={ ( value ) =>
				onChangeView( { ...view, perPage: value, page: 1 } )
			}
		/>
	);
}

// For now this is copied from the patterns list Pagination component, because
// the datatable pagination starts from index zero(`0`). Eventually all lists will be
// using this one.
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
				<HStack expanded={ false } spacing={ 1 }>
					<Button
						variant="tertiary"
						onClick={ () => onChangeView( { ...view, page: 1 } ) }
						disabled={ view.page === 1 }
						aria-label={ __( 'First page' ) }
					>
						«
					</Button>
					<Button
						variant="tertiary"
						onClick={ () =>
							onChangeView( { ...view, page: view.page - 1 } )
						}
						disabled={ view.page === 1 }
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
					<Button
						variant="tertiary"
						onClick={ () =>
							onChangeView( { ...view, page: view.page + 1 } )
						}
						disabled={ view.page >= totalPages }
						aria-label={ __( 'Next page' ) }
					>
						›
					</Button>
					<Button
						variant="tertiary"
						onClick={ () =>
							onChangeView( { ...view, page: totalPages } )
						}
						disabled={ view.page >= totalPages }
						aria-label={ __( 'Last page' ) }
					>
						»
					</Button>
				</HStack>
			) }
			<PageSizeControl view={ view } onChangeView={ onChangeView } />
		</HStack>
	);
}

export default Pagination;
