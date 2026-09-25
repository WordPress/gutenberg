import clsx from 'clsx';
import { forwardRef, useId } from '@wordpress/element';
import { __, _n, isRTL, sprintf } from '@wordpress/i18n';
import { Stack } from '../../../stack';
import { VisuallyHidden } from '../../../visually-hidden';
import defenseStyles from '../../../utils/css/global-css-defense.module.css';
import focusStyles from '../../../utils/css/focus.module.scss';
import * as Combobox from '../combobox';
import { InputLayout } from '../input-layout';
import { SearchableResults } from '../searchable-results';
import styles from './style.module.css';
import { warnSearchableChipSelectProps } from './dev-warnings';
import type { Item, SearchableChipSelectProps } from './types';

function getChipsToolbarLabel( selectedCount: number ): string | undefined {
	if ( selectedCount === 0 ) {
		return undefined;
	}
	return _n( 'Selected item', 'Selected items', selectedCount );
}

function getInputSelectionHint( selectedCount: number ): string | undefined {
	if ( selectedCount === 0 ) {
		return undefined;
	}

	return sprintf(
		/* translators: 1: number of selected items. 2: arrow key name ("Left Arrow" or "Right Arrow"). */
		_n(
			'%1$d item selected. From the start of the input, press %2$s to move to the selected item.',
			'%1$d items selected. From the start of the input, press %2$s to move to the selected items.',
			selectedCount
		),
		selectedCount,
		isRTL() ? __( 'Right Arrow' ) : __( 'Left Arrow' )
	);
}

/**
 * A low-level primitive for a searchable multi-selection field with chips, with
 * support for a creatable footer action.
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
		statusContent,
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
	const inputHintId = useId();

	warnSearchableChipSelectProps( items, children );

	return (
		<Combobox.Root
			items={ items }
			multiple
			disabled={ disabled }
			{ ...restProps }
			readOnly={ undefined }
		>
			<Combobox.InputGroup>
				<Combobox.Value>
					{ ( value: Item[] ) => {
						const selectedCount = value.length;
						const selectionHint =
							getInputSelectionHint( selectedCount );

						return (
							<>
								<Combobox.Chips
									render={
										<InputLayout
											className={ clsx(
												focusStyles[
													'outset-ring--focus-within'
												],
												styles[ 'input-layout' ]
											) }
											visuallyDisabled={ disabled }
										/>
									}
									aria-label={ getChipsToolbarLabel(
										selectedCount
									) }
								>
									{ selectedCount > 0 && (
										<Stack
											align="start"
											className={
												styles[ 'chips-edit-area' ]
											}
										>
											<Stack
												gap="xs"
												wrap="wrap"
												className={
													styles[ 'chips-list' ]
												}
											>
												{ chipsContent
													? chipsContent( value )
													: value.map( ( item ) => (
															<Combobox.ChipWithRemove
																key={
																	item.value
																}
															>
																{ item.label }
															</Combobox.ChipWithRemove>
														) ) }
											</Stack>
											{ showClearButton && (
												<Combobox.Clear
													aria-label={
														clearButtonLabel
													}
												/>
											) }
										</Stack>
									) }

									<Combobox.Input
										key="searchable-chip-select-input"
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
										aria-describedby={
											clsx(
												ariaDescribedby,
												selectionHint && inputHintId
											) || undefined
										}
									/>
								</Combobox.Chips>
								{ selectionHint && (
									<VisuallyHidden
										id={ inputHintId }
										aria-hidden="true"
									>
										{ selectionHint }
									</VisuallyHidden>
								) }
							</>
						);
					} }
				</Combobox.Value>
			</Combobox.InputGroup>

			<Combobox.Popup width={ popupWidth }>
				<SearchableResults
					emptyContent={ emptyContent }
					statusContent={ statusContent }
				>
					{ children }
				</SearchableResults>
			</Combobox.Popup>
		</Combobox.Root>
	);
} );
