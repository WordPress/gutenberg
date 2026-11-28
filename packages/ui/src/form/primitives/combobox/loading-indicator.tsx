import { forwardRef } from '@wordpress/element';
import { LoadingIndicator as ItemPopupLoadingIndicator } from '../../../utils/item-popup/loading-indicator';
import type { LoadingIndicatorProps } from '../../../utils/item-popup/types';

/**
 * A non-interactive loading row aligned with popup items. Render it inside
 * `Combobox.Status` while loading, keeping Status mounted for announcements.
 * Override the default loading message with `children`.
 */
export const LoadingIndicator = forwardRef<
	HTMLDivElement,
	LoadingIndicatorProps
>( function ComboboxLoadingIndicator( props, ref ) {
	return <ItemPopupLoadingIndicator ref={ ref } { ...props } />;
} );

LoadingIndicator.displayName = 'Combobox.LoadingIndicator';
