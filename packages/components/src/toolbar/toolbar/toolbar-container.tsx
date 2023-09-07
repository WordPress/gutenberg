/**
 * External dependencies
 */
import { useToolbarStore, Toolbar } from '@ariakit/react/toolbar';
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
	const toolbarStore = useToolbarStore( {
		focusLoop: true,
		rtl: isRTL(),
	} );

	return (
		// This will provide state for `ToolbarButton`'s
		<ToolbarContext.Provider value={ toolbarStore }>
			<Toolbar
				ref={ ref }
				aria-label={ label }
				store={ toolbarStore }
				{ ...props }
			/>
		</ToolbarContext.Provider>
	);
}

export const ToolbarContainer = forwardRef( UnforwardedToolbarContainer );
export default ToolbarContainer;
