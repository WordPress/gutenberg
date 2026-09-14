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

type ChipSelectA11y =
	| { status: 'empty' }
	| { status: 'selected'; count: number };

function toChipSelectA11y( value: ReadonlyArray< unknown > ): ChipSelectA11y {
	if ( value.length === 0 ) {
		return { status: 'empty' };
	}
	return { status: 'selected', count: value.length };
}

function chipsToolbarLabel( a11y: ChipSelectA11y ): string | undefined {
	if ( a11y.status === 'empty' ) {
		return undefined;
	}
	return _n( 'Selected item', 'Selected items', a11y.count );
}

function inputSelectionHint( a11y: ChipSelectA11y ): string | undefined {
	if ( a11y.status === 'empty' ) {
		return undefined;
	}
	return sprintf(
		/* translators: 1: number of selected items. 2: arrow key name ("Left Arrow" or "Right Arrow"). */
		_n(
			'%1$d item selected. From the start of the input, press %2$s to move to the selected item.',
			'%1$d items selected. From the start of the input, press %2$s to move to the selected items.',
			a11y.count
		),
		a11y.count,
		isRTL() ? __( 'Right Arrow' ) : __( 'Left Arrow' )
	);
}

function mergeDescribedBy(
	...ids: Array< string | undefined >
): string | undefined {
	const merged = ids.filter( Boolean ).join( ' ' );
	return merged === '' ? undefined : merged;
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
		>
			<Combobox.InputGroup>
				<Combobox.Value>
					{ ( value: Item[] ) => {
						const a11y = toChipSelectA11y( value );
						const selectionHint = inputSelectionHint( a11y );

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
									aria-label={ chipsToolbarLabel( a11y ) }
								>
									{ a11y.status === 'selected' && (
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
										aria-describedby={ mergeDescribedBy(
											ariaDescribedby,
											a11y.status === 'selected'
												? inputHintId
												: undefined
										) }
									/>
								</Combobox.Chips>
								{ selectionHint && (
									<VisuallyHidden
										id={ inputHintId }
										render={ <span /> }
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
