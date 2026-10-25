import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import type { ForwardedRef } from 'react';
import type { PanelRowProps } from './types';

function UnforwardedPanelRow(
	{ className, children }: PanelRowProps,
	ref: ForwardedRef< HTMLDivElement >
) {
	return (
		<div
			className={ clsx( 'components-panel__row', className ) }
			ref={ ref }
		>
			{ children }
		</div>
	);
}

/**
 * `PanelRow` is a generic container for rows within a `PanelBody`.
 * It is a flex container with a top margin for spacing.
 */
export const PanelRow = forwardRef( UnforwardedPanelRow );
PanelRow.displayName = 'PanelRow';

export default PanelRow;
