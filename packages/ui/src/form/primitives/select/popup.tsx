import { Select as _Select } from '@base-ui/react/select';
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
import type { SelectPopupProps } from './types';
import { ITEM_POPUP_POSITIONER_PROPS } from '../constants';

const ThemeProvider: typeof ThemeProviderType =
	unlock( themePrivateApis ).ThemeProvider;

export const Popup = forwardRef< HTMLDivElement, SelectPopupProps >(
	function Popup( { className, children, style, ...restProps }, ref ) {
		return (
			<_Select.Portal>
				<_Select.Positioner
					{ ...ITEM_POPUP_POSITIONER_PROPS }
					alignItemWithTrigger={ false }
					style={ style }
					className={ clsx(
						resetStyles[ 'box-sizing' ],
						styles.positioner,
						className
					) }
				>
					<ThemeProvider>
						<_Select.Popup
							ref={ ref }
							className={ itemPopupStyles.popup }
							{ ...restProps }
						>
							<_Select.List className={ itemPopupStyles.list }>
								<div
									className={
										itemPopupStyles[
											'list-scrollable-container'
										]
									}
								>
									{ children }
								</div>
							</_Select.List>
						</_Select.Popup>
					</ThemeProvider>
				</_Select.Positioner>
			</_Select.Portal>
		);
	}
);
