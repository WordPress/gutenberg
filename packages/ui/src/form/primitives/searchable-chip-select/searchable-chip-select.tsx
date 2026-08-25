import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Stack } from '../../../stack';
import defenseStyles from '../../../utils/css/global-css-defense.module.css';
import focusStyles from '../../../utils/css/focus.module.scss';
import * as Combobox from '../combobox';
import { InputLayout } from '../input-layout';
import styles from './style.module.css';
import { warnSearchableChipSelectProps } from './dev-warnings';
import type { Item, ItemGroup, SearchableChipSelectProps } from './types';
import {
	findCreatableItem,
	isItem,
	normalizeRootItems,
	shouldSkipCollectionEntry,
} from './types';

/**
 * A low-level primitive for a searchable multi-selection field with chips, with
 * support for a footer item to create new items.
 *
 * Prefer `SearchableChipSelectControl` when using with a standard label and description.
 */
export const SearchableChipSelect = forwardRef<
	HTMLInputElement,
	SearchableChipSelectProps
>( function SearchableChipSelect(
	{
		children,
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
	warnSearchableChipSelectProps( items, children );

	const creatableItem = findCreatableItem( items );
	const comboboxItems = normalizeRootItems( items );

	return (
		<Combobox.Root
			items={ comboboxItems }
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
						ref={ ref }
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
							{ ( entry: Item | ItemGroup, ...args ) => {
								if (
									shouldSkipCollectionEntry(
										entry,
										creatableItem
									)
								) {
									return null;
								}

								if ( children ) {
									return children( entry, ...args );
								}

								if ( ! isItem( entry ) ) {
									return null;
								}

								return (
									<Combobox.Item
										key={ entry.value }
										value={ entry }
										disabled={ entry.disabled }
									>
										{ entry.label }
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
