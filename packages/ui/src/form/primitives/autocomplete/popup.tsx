import { Autocomplete as _Autocomplete } from '@base-ui/react/autocomplete';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import {
	type ThemeProvider as ThemeProviderType,
	privateApis as themePrivateApis,
} from '@wordpress/theme';
import { unlock } from '../../../lock-unlock';
import itemPopupStyles from '../../../utils/css/item-popup.module.css';
import resetStyles from '../../../utils/css/resets.module.css';
import styles from './style.module.css';
import type { AutocompletePopupProps } from './types';
import { ITEM_POPUP_POSITIONER_PROPS } from '../constants';

const ThemeProvider: typeof ThemeProviderType =
	unlock( themePrivateApis ).ThemeProvider;

export const Popup = forwardRef< HTMLDivElement, AutocompletePopupProps >(
	function Popup( { className, style, ...restProps }, ref ) {
		return (
			<_Autocomplete.Portal>
				<_Autocomplete.Positioner
					{ ...ITEM_POPUP_POSITIONER_PROPS }
					style={ style }
					className={ clsx(
						resetStyles[ 'box-sizing' ],
						styles.positioner,
						className
					) }
				>
					<ThemeProvider>
						<_Autocomplete.Popup
							ref={ ref }
							className={ itemPopupStyles.popup }
							{ ...restProps }
						/>
					</ThemeProvider>
				</_Autocomplete.Positioner>
			</_Autocomplete.Portal>
		);
	}
);
