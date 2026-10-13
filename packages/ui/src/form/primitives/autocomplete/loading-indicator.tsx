import { forwardRef } from '@wordpress/element';
import { LoadingIndicator as ItemPopupLoadingIndicator } from '../../../utils/item-popup/loading-indicator';
import type { AutocompleteLoadingIndicatorProps } from './types';

/**
 * A non-interactive loading row aligned with popup items. Render it inside
 * `Autocomplete.Status` while loading, keeping Status mounted for announcements.
 * Override the default loading message with `children`.
 */
export const LoadingIndicator = forwardRef<
	HTMLDivElement,
	AutocompleteLoadingIndicatorProps
>( function AutocompleteLoadingIndicator( props, ref ) {
	return <ItemPopupLoadingIndicator ref={ ref } { ...props } />;
} );

LoadingIndicator.displayName = 'Autocomplete.LoadingIndicator';
