import { forwardRef } from '@wordpress/element';
import { LoadingIndicator as ItemPopupLoadingIndicator } from '../../../utils/item-popup/loading-indicator';
import type { ComboboxLoadingIndicatorProps } from './types';

/**
 * A non-interactive loading row aligned with popup items. Render it inside
 * `Combobox.Status` while loading, keeping Status mounted for announcements.
 * Override the default loading message with `children`.
 */
export const LoadingIndicator = forwardRef<
	HTMLDivElement,
	ComboboxLoadingIndicatorProps
>( function ComboboxLoadingIndicator( props, ref ) {
	return <ItemPopupLoadingIndicator ref={ ref } { ...props } />;
} );

LoadingIndicator.displayName = 'Combobox.LoadingIndicator';
