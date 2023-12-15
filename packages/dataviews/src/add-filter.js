/**
 * WordPress dependencies
 */
import {
	privateApis as componentsPrivateApis,
	Button,
	Icon,
} from '@wordpress/components';
import { chevronRightSmall, funnel, check } from '@wordpress/icons';
import { __, sprintf } from '@wordpress/i18n';
import { Children, Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from './lock-unlock';
import { LAYOUT_LIST, OPERATOR_IN, OPERATOR_NOT_IN } from './constants';

const {
	DropdownMenuV2: DropdownMenu,
	DropdownMenuGroupV2: DropdownMenuGroup,
	DropdownSubMenuV2: DropdownSubMenu,
	DropdownSubMenuTriggerV2: DropdownSubMenuTrigger,
	DropdownMenuItemV2: DropdownMenuItem,
	DropdownMenuSeparatorV2: DropdownMenuSeparator,
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
			label={ __( 'Filters' ) }
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
		>
			<WithSeparators>
				<DropdownMenuGroup>
					{ filters.map( ( filter ) => {
						const filterInView = view.filters.find(
							( f ) => f.field === filter.field
						);
						const activeElement = filter.elements.find(
							( element ) => element.value === filterInView?.value
						);
						const activeOperator =
							filterInView?.operator || filter.operators[ 0 ];
						return (
							<DropdownSubMenu
								key={ filter.field }
								trigger={
									<DropdownSubMenuTrigger
										suffix={
											<>
												{ activeElement &&
													activeOperator ===
														OPERATOR_IN &&
													__( 'Is' ) }
												{ activeElement &&
													activeOperator ===
														OPERATOR_NOT_IN &&
													__( 'Is not' ) }
												{ activeElement && ' ' }
												{ activeElement?.label }
												<Icon
													icon={ chevronRightSmall }
												/>
											</>
										}
									>
										{ filter.name }
									</DropdownSubMenuTrigger>
								}
							>
								<WithSeparators>
									<DropdownMenuGroup>
										{ filter.elements.map( ( element ) => (
											<DropdownMenuItem
												key={ element.value }
												role="menuitemradio"
												aria-checked={
													activeElement?.value ===
													element.value
												}
												prefix={
													activeElement?.value ===
														element.value && (
														<Icon icon={ check } />
													)
												}
												onSelect={ ( event ) => {
													event.preventDefault();
													onChangeView(
														( currentView ) => ( {
															...currentView,
															page: 1,
															filters: [
																...currentView.filters.filter(
																	( f ) =>
																		f.field !==
																		filter.field
																),
																{
																	field: filter.field,
																	operator:
																		activeOperator,
																	value:
																		activeElement?.value ===
																		element.value
																			? undefined
																			: element.value,
																},
															],
														} )
													);
												} }
											>
												{ element.label }
											</DropdownMenuItem>
										) ) }
									</DropdownMenuGroup>
									{ filter.operators.length > 1 && (
										<DropdownSubMenu
											trigger={
												<DropdownSubMenuTrigger
													suffix={
														<>
															{ activeOperator ===
																OPERATOR_IN &&
																__( 'Is' ) }
															{ activeOperator ===
																OPERATOR_NOT_IN &&
																__( 'Is not' ) }
															<Icon
																icon={
																	chevronRightSmall
																}
															/>{ ' ' }
														</>
													}
												>
													{ __( 'Conditions' ) }
												</DropdownSubMenuTrigger>
											}
										>
											<DropdownMenuItem
												key="in-filter"
												role="menuitemradio"
												aria-checked={
													activeOperator ===
													OPERATOR_IN
												}
												prefix={
													activeOperator ===
														OPERATOR_IN && (
														<Icon icon={ check } />
													)
												}
												onSelect={ ( event ) => {
													event.preventDefault();
													onChangeView(
														( currentView ) => ( {
															...currentView,
															page: 1,
															filters: [
																...view.filters.filter(
																	( f ) =>
																		f.field !==
																		filter.field
																),
																{
																	field: filter.field,
																	operator:
																		OPERATOR_IN,
																	value: filterInView?.value,
																},
															],
														} )
													);
												} }
											>
												{ __( 'Is' ) }
											</DropdownMenuItem>
											<DropdownMenuItem
												key="not-in-filter"
												role="menuitemradio"
												aria-checked={
													activeOperator ===
													OPERATOR_NOT_IN
												}
												prefix={
													activeOperator ===
														OPERATOR_NOT_IN && (
														<Icon icon={ check } />
													)
												}
												onSelect={ ( event ) => {
													event.preventDefault();
													onChangeView(
														( currentView ) => ( {
															...currentView,
															page: 1,
															filters: [
																...view.filters.filter(
																	( f ) =>
																		f.field !==
																		filter.field
																),
																{
																	field: filter.field,
																	operator:
																		OPERATOR_NOT_IN,
																	value: filterInView?.value,
																},
															],
														} )
													);
												} }
											>
												{ __( 'Is not' ) }
											</DropdownMenuItem>
										</DropdownSubMenu>
									) }
									<DropdownMenuItem
										key={ 'reset-filter-' + filter.name }
										disabled={ ! activeElement }
										onSelect={ ( event ) => {
											event.preventDefault();
											onChangeView( ( currentView ) => ( {
												...currentView,
												page: 1,
												filters:
													currentView.filters.filter(
														( f ) =>
															f.field !==
															filter.field
													),
											} ) );
										} }
									>
										{ sprintf(
											/* translators: 1: Filter name. e.g.: "Reset Author". */
											__( 'Reset %1$s' ),
											filter.name.toLowerCase()
										) }
									</DropdownMenuItem>
								</WithSeparators>
							</DropdownSubMenu>
						);
					} ) }
				</DropdownMenuGroup>
				<DropdownMenuItem
					disabled={
						view.search === '' && view.filters?.length === 0
					}
					onSelect={ ( event ) => {
						event.preventDefault();
						onChangeView( ( currentView ) => ( {
							...currentView,
							page: 1,
							filters: [],
						} ) );
					} }
				>
					{ __( 'Reset filters' ) }
				</DropdownMenuItem>
			</WithSeparators>
		</DropdownMenu>
	);
}
