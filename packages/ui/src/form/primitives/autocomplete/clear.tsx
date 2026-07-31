import { Autocomplete as _Autocomplete } from '@base-ui/react/autocomplete';
import { forwardRef } from '@wordpress/element';
import { closeSmall } from '@wordpress/icons';
import i18n from '@wordpress/ui-i18n';
import { IconButton } from '../../../icon-button';
import type { AutocompleteClearProps } from './types';

const DEFAULT_RENDER = (
	{
		'aria-label': ariaLabel = i18n.CLEAR(),
		...props
	}: AutocompleteClearProps,
	{ disabled }: _Autocomplete.Clear.State
) => (
	<IconButton
		icon={ closeSmall }
		focusableWhenDisabled={ false }
		disabled={ disabled }
		aria-hidden={ disabled || undefined }
		size="small"
		variant="minimal"
		tone="neutral"
		label={ ariaLabel }
		{ ...props }
	/>
);

/**
 * A button that clears the input value.
 */
export const Clear = forwardRef< HTMLButtonElement, AutocompleteClearProps >(
	function Clear( { render = DEFAULT_RENDER, ...restProps }, ref ) {
		return (
			<_Autocomplete.Clear
				ref={ ref }
				render={ render }
				{ ...restProps }
			/>
		);
	}
);
