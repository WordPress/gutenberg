import { Combobox as _Combobox } from '@base-ui/react/combobox';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import {
	type ThemeProvider as ThemeProviderType,
	privateApis as themePrivateApis,
} from '@wordpress/theme';
import { unlock } from '../../../lock-unlock';
import { Portal } from './portal';
import { renderSlotWithChildren } from '../../../utils/render-slot-with-children';
import itemPopupStyles from '../../../utils/css/item-popup.module.css';
import resetStyles from '../../../utils/css/resets.module.css';
import styles from './style.module.css';
import type { ComboboxPopupProps } from './types';
import { ITEM_POPUP_POSITIONER_PROPS } from '../constants';

const ThemeProvider: typeof ThemeProviderType =
	unlock( themePrivateApis ).ThemeProvider;

export const Popup = forwardRef< HTMLDivElement, ComboboxPopupProps >(
	function Popup( { className, portal, ...restProps }, ref ) {
		const portalChildren = (
			<_Combobox.Positioner
				{ ...ITEM_POPUP_POSITIONER_PROPS }
				className={ clsx(
					resetStyles[ 'box-sizing' ],
					styles.positioner
				) }
			>
				<ThemeProvider>
					<_Combobox.Popup
						ref={ ref }
						className={ clsx( itemPopupStyles.popup, className ) }
						{ ...restProps }
					/>
				</ThemeProvider>
			</_Combobox.Positioner>
		);

		return renderSlotWithChildren( portal, <Portal />, portalChildren );
	}
);
