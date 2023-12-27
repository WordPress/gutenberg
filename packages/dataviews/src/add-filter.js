/**
 * WordPress dependencies
 */
import {
	privateApis as componentsPrivateApis,
	Button,
} from '@wordpress/components';
import { funnel } from '@wordpress/icons';
import { __, sprintf } from '@wordpress/i18n';
import { Children, Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from './lock-unlock';
import { LAYOUT_LIST, OPERATORS } from './constants';
import { DropdownMenuRadioItemCustom } from './dropdown-menu-helper';

const {
	DropdownMenuV2: DropdownMenu,
	DropdownMenuGroupV2: DropdownMenuGroup,
	DropdownMenuItemV2: DropdownMenuItem,
	DropdownMenuRadioItemV2: DropdownMenuRadioItem,
	DropdownMenuSeparatorV2: DropdownMenuSeparator,
	DropdownMenuItemLabelV2: DropdownMenuItemLabel,
} = unlock( componentsPrivateApis );

function WithSeparators( { children } ) {
	return Children.toArray( children )
		.filter( Boolean )
		.map( ( child, i ) => (
			<Fragment key={ i }>
				{ i > 0 && <DropdownMenuSeparator /> }
				{ child }
			</Fragment>
		) );
}

export default function AddFilter( { filters, view, onChangeView } ) {
	if ( filters.length === 0 ) {
		return null;
	}

	const filterCount = view.filters.reduce( ( acc, filter ) => {
		if ( filter.value !== undefined ) {
			return acc + 1;
		}
		return acc;
	}, 0 );

	return (
		<DropdownMenu
			trigger={
				<Button
					__experimentalIsFocusable
					label={ __( 'Filters' ) }
					size="compact"
					icon={ funnel }
					className="dataviews-filters-button"
				>
					{ view.type === LAYOUT_LIST && filterCount > 0 ? (
						<span className="dataviews-filters-count">
							{ filterCount }
						</span>
					) : null }
				</Button>
			}
			style={ {
				minWidth: '230px',
			} }
		>
			<WithSeparators>
				<DropdownMenuGroup>
					{ filters.map( ( filter ) => {
						const filterInView = view.filters.find(
							( f ) => f.field === filter.field
						);
						const otherFilters = view.filters.filter(
							( f ) => f.field !== filter.field
						);
						const activeElement = filter.elements.find(
							( element ) => element.value === filterInView?.value
						);
						const activeOperator =
							filterInView?.operator || filter.operators[ 0 ];
						return (
							<DropdownMenu
								key={ filter.field }
								trigger={
									<DropdownMenuItem
										suffix={
											activeElement && (
												<span aria-hidden="true">
													{ activeOperator in
														OPERATORS &&
														`${ OPERATORS[ activeOperator ].label } ` }
													{ activeElement.label }
												</span>
											)
										}
									>
										<DropdownMenuItemLabel>
											{ filter.name }
										</DropdownMenuItemLabel>
									</DropdownMenuItem>
								}
								style={ {
									minWidth: '200px',
								} }
							>
								<WithSeparators>
									<DropdownMenuGroup>
										{ filter.elements.map( ( element ) => {
											const isActive =
												activeElement?.value ===
												element.value;
											return (
												<DropdownMenuRadioItemCustom
													key={ element.value }
													name={ `add-filter-${ filter.field.id }` }
													value={ element.value }
													checked={ isActive }
													onClick={ () => {
														onChangeView( {
															...view,
															page: 1,
															filters: [
																...otherFilters,
																{
																	field: filter.field,
																	operator:
																		activeOperator,
																	value: isActive
																		? undefined
																		: element.value,
																},
															],
														} );
													} }
												>
													<DropdownMenuItemLabel>
														{ element.label }
													</DropdownMenuItemLabel>
												</DropdownMenuRadioItemCustom>
											);
										} ) }
									</DropdownMenuGroup>
									{ filter.operators.length > 1 && (
										<DropdownMenu
											trigger={
												<DropdownMenuItem
													suffix={
														<span aria-hidden="true">
															{
																OPERATORS[
																	activeOperator
																]?.label
															}
														</span>
													}
												>
													<DropdownMenuItemLabel>
														{ __( 'Conditions' ) }
													</DropdownMenuItemLabel>
												</DropdownMenuItem>
											}
										>
											{ Object.entries( OPERATORS ).map(
												( [
													operator,
													{ label, key },
												] ) => (
													<DropdownMenuRadioItem
														key={ key }
														name={ `add-filter-${ filter.name }-conditions` }
														value={ operator }
														checked={
															activeOperator ===
															operator
														}
														onChange={ ( e ) => {
															onChangeView( {
																...view,
																page: 1,
																filters: [
																	...otherFilters,
																	{
																		field: filter.field,
																		operator:
																			e
																				.target
																				.value,
																		value: filterInView?.value,
																	},
																],
															} );
														} }
													>
														<DropdownMenuItemLabel>
															{ label }
														</DropdownMenuItemLabel>
													</DropdownMenuRadioItem>
												)
											) }
										</DropdownMenu>
									) }
									<DropdownMenuItem
										key={ 'reset-filter-' + filter.name }
										disabled={ ! activeElement }
										hideOnClick={ false }
										onClick={ () => {
											onChangeView( {
												...view,
												page: 1,
												filters: view.filters.filter(
													( f ) =>
														f.field !== filter.field
												),
											} );
										} }
									>
										<DropdownMenuItemLabel>
											{ sprintf(
												/* translators: 1: Filter name. e.g.: "Reset Author". */
												__( 'Reset %1$s' ),
												filter.name.toLowerCase()
											) }
										</DropdownMenuItemLabel>
									</DropdownMenuItem>
								</WithSeparators>
							</DropdownMenu>
						);
					} ) }
				</DropdownMenuGroup>
				<DropdownMenuItem
					disabled={
						view.search === '' && view.filters?.length === 0
					}
					hideOnClick={ false }
					onClick={ () => {
						onChangeView( {
							...view,
							page: 1,
							filters: [],
						} );
					} }
				>
					<DropdownMenuItemLabel>
						{ __( 'Reset filters' ) }
					</DropdownMenuItemLabel>
				</DropdownMenuItem>
			</WithSeparators>
		</DropdownMenu>
	);
}
