import clsx from 'clsx';
import { Autocomplete as _Autocomplete } from '@base-ui/react/autocomplete';
import { forwardRef } from '@wordpress/element';
import type { PositionerProps } from './types';
import resetStyles from '../../../utils/css/resets.module.css';
import styles from './style.module.css';
import { ITEM_POPUP_POSITIONER_PROPS } from '../constants';

/**
 * Positions the floating autocomplete popup relative to its input. Pass to
 * `Autocomplete.Popup`'s `positioner` prop to customize `side`, `align`,
 * `sideOffset`, collision behavior, etc. When `positioner` is omitted,
 * `Autocomplete.Popup` uses this component with default props.
 */
const Positioner = forwardRef< HTMLDivElement, PositionerProps >(
	function AutocompletePositioner( { className, ...props }, ref ) {
		return (
			<_Autocomplete.Positioner
				{ ...ITEM_POPUP_POSITIONER_PROPS }
				{ ...props }
				ref={ ref }
				className={ clsx(
					resetStyles[ 'box-sizing' ],
					styles.positioner,
					className
				) }
			/>
		);
	}
);

export { Positioner };
