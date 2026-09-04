import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Stack } from '../../../stack';
import defenseStyles from '../../../utils/css/global-css-defense.module.css';
import focusStyles from '../../../utils/css/focus.module.scss';
import * as Combobox from '../combobox';
import { InputLayout } from '../input-layout';
import { SearchableCollection } from '../searchable-collection';
import styles from './style.module.css';
import type { Item, SearchableChipSelectProps } from './types';

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
		popupWidth,
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
		<SearchableCollection.Root
			name="SearchableChipSelect"
			items={ items }
			collection={ children }
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
								type="text"
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

			<Combobox.Popup width={ popupWidth }>
				<SearchableCollection.List emptyContent={ emptyContent } />
			</Combobox.Popup>
		</SearchableCollection.Root>
	);
} );
