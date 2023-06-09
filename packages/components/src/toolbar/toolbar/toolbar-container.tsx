/**
 * External dependencies
 */
import { useToolbarState, Toolbar } from 'reakit/Toolbar';
import type { ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';
import { isRTL } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ToolbarContext from '../toolbar-context';
import type { ToolbarProps } from './types';
import type { WordPressComponentProps } from '../../ui/context';

function UnforwardedToolbarContainer(
	{ label, ...props }: WordPressComponentProps< ToolbarProps, 'div', false >,
	ref: ForwardedRef< any >
) {
	// https://reakit.io/docs/basic-concepts/#state-hooks
	// Passing baseId for server side rendering (which includes snapshots)
	// If an id prop is passed to Toolbar, toolbar items will use it as a base for their ids
	const toolbarState = useToolbarState( {
		loop: true,
		baseId: props.id,
		rtl: isRTL(),
	} );

	return (
		// This will provide state for `ToolbarButton`'s
		<ToolbarContext.Provider value={ toolbarState }>
			<Toolbar
				ref={ ref }
				aria-label={ label }
				{ ...toolbarState }
				{ ...props }
			/>
		</ToolbarContext.Provider>
	);
}

export const ToolbarContainer = forwardRef( UnforwardedToolbarContainer );
export default ToolbarContainer;
