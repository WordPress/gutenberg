import { forwardRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import * as Combobox from '../combobox';
import { SearchableCollection } from '../searchable-collection';
import styles from './style.module.css';
import type { SearchableSelectProps } from './types';

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
		placeholder,
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
	return (
		<SearchableCollection.Root< false >
			name="SearchableSelect"
			items={ items }
			collection={ children }
			{ ...restProps }
		>
			<Combobox.Trigger
				ref={ ref }
				placeholder={ placeholder }
				aria-label={ ariaLabel }
				aria-labelledby={ ariaLabelledby }
				aria-describedby={ ariaDescribedby }
			>
				{ triggerContent }
			</Combobox.Trigger>

			<Combobox.Popup
				width={ popupWidth }
				aria-label={ ariaLabel }
				aria-labelledby={ ariaLabelledby }
			>
				<div className={ styles[ 'input-wrapper' ] }>
					<Combobox.Input
						placeholder={ searchPlaceholder }
						aria-label={ searchPlaceholder }
					/>
				</div>
				<SearchableCollection.List emptyContent={ emptyContent } />
			</Combobox.Popup>
		</SearchableCollection.Root>
	);
} );
