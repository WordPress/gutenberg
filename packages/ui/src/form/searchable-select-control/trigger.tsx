import { forwardRef } from '@wordpress/element';
import { Trigger as SearchableSelectTrigger } from '../primitives/searchable-select/trigger';
import type { SearchableSelectTriggerProps } from '../primitives/searchable-select/types';

/**
 * The trigger button for a `SearchableSelectControl`.
 */
export const Trigger = forwardRef<
	HTMLButtonElement,
	SearchableSelectTriggerProps
>( function UnforwardedTrigger( props, ref ) {
	return <SearchableSelectTrigger ref={ ref } { ...props } />;
} );
