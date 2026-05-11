import clsx from 'clsx';
import { Autocomplete as _Autocomplete } from '@base-ui/react/autocomplete';
import { forwardRef } from '@wordpress/element';
import type { AutocompletePositionerProps } from './types';
import resetStyles from '../../../utils/css/resets.module.css';
import styles from './style.module.css';
import { ITEM_POPUP_POSITIONER_PROPS } from '../constants';

/**
 * Positions the floating autocomplete popup relative to its input. Pass to
 * `Autocomplete.Popup`'s `positioner` prop to customize `side`, `align`,
 * `sideOffset`, collision behavior, etc. When `positioner` is omitted,
 * `Autocomplete.Popup` uses this component with default props.
 */
const Positioner = forwardRef< HTMLDivElement, AutocompletePositionerProps >(
	function AutocompletePositioner(
		{
			align = ITEM_POPUP_POSITIONER_PROPS.align,
			className,
			collisionPadding = ITEM_POPUP_POSITIONER_PROPS.collisionPadding,
			sideOffset = ITEM_POPUP_POSITIONER_PROPS.sideOffset,
			...props
		},
		ref
	) {
		return (
			<_Autocomplete.Positioner
				ref={ ref }
				align={ align }
				collisionPadding={ collisionPadding }
				sideOffset={ sideOffset }
				{ ...props }
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
