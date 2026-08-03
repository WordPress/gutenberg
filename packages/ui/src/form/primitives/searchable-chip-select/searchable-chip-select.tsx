import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Stack } from '../../../stack';
import defenseStyles from '../../../utils/css/global-css-defense.module.css';
import focusStyles from '../../../utils/css/focus.module.scss';
import * as Combobox from '../combobox';
import { InputLayout } from '../input-layout';
import styles from './style.module.css';
import type { Item, SearchableChipSelectProps } from './types';

/**
 * A searchable multi-selection component with chips, with support for
 * a footer item to create new items.
 */
export const SearchableChipSelect = forwardRef<
	HTMLDivElement,
	SearchableChipSelectProps
>( function SearchableChipSelect(
	{
		children,
		creatableItem,
		disabled,
		emptyContent = __( 'No results found.' ),
		items,
		chipsContent,
		searchPlaceholder = __( 'Search' ),
		showClearButton = true,
		clearButtonLabel = __( 'Clear all' ),
		'aria-label': ariaLabel,
		'aria-labelledby': ariaLabelledby,
		'aria-describedby': ariaDescribedby,
		...restProps
	},
	ref
) {
	return (
		<Combobox.Root
			items={
				! creatableItem ? items : [ ...( items ?? [] ), creatableItem ]
			}
			multiple
			disabled={ disabled }
			{ ...restProps }
		>
			<Combobox.InputGroup>
				<Combobox.Chips
					render={
						<InputLayout
							className={ clsx(
								focusStyles[ 'outset-ring--focus-within' ],
								styles[ 'input-layout' ]
							) }
							visuallyDisabled={ disabled }
						/>
					}
					ref={ ref }
				>
					<Combobox.Value>
						{ ( value: Item[] ) => (
							<>
								{ value.length > 0 && (
									<Stack
										align="start"
										className={
											styles[ 'chips-edit-area' ]
										}
									>
										<Stack
											gap="xs"
											wrap="wrap"
											className={ styles[ 'chips-list' ] }
										>
											{ chipsContent
												? chipsContent( value )
												: value.map( ( item ) => (
														<Combobox.ChipWithRemove
															key={ item.value }
														>
															{ item.label }
														</Combobox.ChipWithRemove>
												  ) ) }
										</Stack>
										{ showClearButton && (
											<Combobox.Clear
												aria-label={ clearButtonLabel }
											/>
										) }
									</Stack>
								) }
							</>
						) }
					</Combobox.Value>

					<Combobox.Input
						render={
							<input
								className={ clsx(
									defenseStyles.input,
									styles.input
								) }
							/>
						}
						placeholder={ searchPlaceholder }
						aria-label={ ariaLabel }
						aria-labelledby={ ariaLabelledby }
						aria-describedby={ ariaDescribedby }
					/>
				</Combobox.Chips>
			</Combobox.InputGroup>

			<Combobox.Popup>
				<Combobox.Empty>{ emptyContent }</Combobox.Empty>
				<Combobox.List>
					<Combobox.ListBody>
						<Combobox.Collection>
							{ ( item: Item, ...args ) => {
								if ( item.value === creatableItem?.value ) {
									return null;
								}
								if ( children ) {
									return children( item, ...args );
								}
								return (
									<Combobox.Item
										key={ item.value }
										value={ item }
										disabled={ item.disabled }
									>
										{ item.label }
									</Combobox.Item>
								);
							} }
						</Combobox.Collection>
					</Combobox.ListBody>
					{ creatableItem && (
						<Combobox.ListFooter>
							<Combobox.Item
								variant="creatable"
								value={ creatableItem }
								disabled={ creatableItem.disabled }
							>
								{ creatableItem.label }
							</Combobox.Item>
						</Combobox.ListFooter>
					) }
				</Combobox.List>
			</Combobox.Popup>
		</Combobox.Root>
	);
} );
