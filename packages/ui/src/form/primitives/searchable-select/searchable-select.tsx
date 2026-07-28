import { forwardRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import * as Combobox from '../combobox';
import styles from './style.module.css';
import type { SearchableSelectProps } from './types';
import type { SelectItem } from '../../select-control/types';

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
		creatableItem,
		emptyContent = __( 'No results found.' ),
		items,
		triggerContent,
		searchPlaceholder = __( 'Search' ),
		'aria-label': ariaLabel,
		'aria-labelledby': ariaLabelledby,
		'aria-describedby': ariaDescribedby,
		...restProps
	},
	ref
) {
	return (
		<Combobox.Root< SelectItem, false >
			items={
				! creatableItem ? items : [ ...( items ?? [] ), creatableItem ]
			}
			{ ...restProps }
		>
			<Combobox.Trigger
				ref={ ref }
				aria-label={ ariaLabel }
				aria-labelledby={ ariaLabelledby }
				aria-describedby={ ariaDescribedby }
			>
				{ triggerContent }
			</Combobox.Trigger>

			<Combobox.Popup>
				<div className={ styles[ 'input-wrapper' ] }>
					<Combobox.Input placeholder={ searchPlaceholder } />
				</div>
				<Combobox.Empty>{ emptyContent }</Combobox.Empty>
				<Combobox.List>
					<Combobox.ListBody>
						<Combobox.Collection>
							{ ( item: SelectItem, ...args ) => {
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
