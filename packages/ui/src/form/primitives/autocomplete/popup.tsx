import { Autocomplete as _Autocomplete } from '@base-ui/react/autocomplete';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import {
	type ThemeProvider as ThemeProviderType,
	privateApis as themePrivateApis,
} from '@wordpress/theme';
import { unlock } from '../../../lock-unlock';
import { renderPortalWithChildren } from '../../../utils/render-portal-with-children';
import itemPopupStyles from '../../../utils/css/item-popup.module.css';
import resetStyles from '../../../utils/css/resets.module.css';
import styles from './style.module.css';
import { Portal } from './portal';
import type { AutocompletePopupProps } from './types';
import { ITEM_POPUP_POSITIONER_PROPS } from '../constants';

const ThemeProvider: typeof ThemeProviderType =
	unlock( themePrivateApis ).ThemeProvider;

export const Popup = forwardRef< HTMLDivElement, AutocompletePopupProps >(
	function Popup( { className, portal, ...restProps }, ref ) {
		const portalChildren = (
			<_Autocomplete.Positioner
				{ ...ITEM_POPUP_POSITIONER_PROPS }
				className={ clsx(
					resetStyles[ 'box-sizing' ],
					styles.positioner
				) }
			>
				<ThemeProvider>
					<_Autocomplete.Popup
						ref={ ref }
						className={ clsx( itemPopupStyles.popup, className ) }
						{ ...restProps }
					/>
				</ThemeProvider>
			</_Autocomplete.Positioner>
		);

		return renderPortalWithChildren( portal, <Portal />, portalChildren );
	}
);
