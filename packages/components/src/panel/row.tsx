/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';
import type { ForwardedRef } from 'react';

/**
 * Internal dependencies
 */
import type { PanelRowProps } from './types';

function UnforwardedPanelRow(
	{ className, children }: PanelRowProps,
	ref: ForwardedRef< HTMLDivElement >
) {
	return (
		<div
			className={ classnames( 'components-panel__row', className ) }
			ref={ ref }
		>
			{ children }
		</div>
	);
}

export const PanelRow = forwardRef( UnforwardedPanelRow );

export default PanelRow;
