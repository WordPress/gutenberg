import { forwardRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import warning from '@wordpress/warning';
import * as Combobox from '../combobox';
import styles from './style.module.css';
import {
	findCreatableItem,
	isCreatableItem,
	normalizeRootItems,
	type Item,
	type SearchableSelectProps,
} from './types';

function warnSearchableSelectProps( items: Item[] | undefined ): void {
	if ( ! items?.length ) {
		return;
	}

	if ( items.filter( isCreatableItem ).length > 1 ) {
		warning(
			'SearchableSelect: expected at most one item with `creatable: true` in `items`.'
		);
	}
}

/**
 * A searchable single-selection component, with support for
 * a footer item to create new items.
 */
export const SearchableSelect = forwardRef<
	HTMLButtonElement,
	SearchableSelectProps
>( function SearchableSelect(
	{
		children,
		emptyContent = __( 'No results found.' ),
		items,
		triggerContent,
		searchPlaceholder = __( 'Search' ),
		popupWidth,
		'aria-label': ariaLabel,
		'aria-labelledby': ariaLabelledby,
		'aria-describedby': ariaDescribedby,
		...restProps
	},
	ref
) {
	warnSearchableSelectProps( items );

	const creatableItem = findCreatableItem( items );
	const comboboxItems = normalizeRootItems( items );

	return (
		<Combobox.Root< Item, false > items={ comboboxItems } { ...restProps }>
			<Combobox.Trigger
				ref={ ref }
				aria-label={ ariaLabel }
				aria-labelledby={ ariaLabelledby }
				aria-describedby={ ariaDescribedby }
			>
				{ triggerContent }
			</Combobox.Trigger>

			<Combobox.Popup popupWidth={ popupWidth }>
				<div className={ styles[ 'input-wrapper' ] }>
					<Combobox.Input placeholder={ searchPlaceholder } />
				</div>
				<Combobox.Empty>{ emptyContent }</Combobox.Empty>
				<Combobox.List>
					<Combobox.ListBody>
						<Combobox.Collection>
							{ ( item: Item, ...args ) => {
								if ( isCreatableItem( item ) ) {
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
