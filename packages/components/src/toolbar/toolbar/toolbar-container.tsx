/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import * as Ariakit from '@ariakit/react';
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
import type { WordPressComponentProps } from '../../context';

function UnforwardedToolbarContainer(
	{ label, ...props }: WordPressComponentProps< ToolbarProps, 'div', false >,
	ref: ForwardedRef< any >
) {
	const toolbarStore = Ariakit.useToolbarStore( {
		focusLoop: true,
		rtl: isRTL(),
	} );

	return (
		// This will provide state for `ToolbarButton`'s
		<ToolbarContext.Provider value={ toolbarStore }>
			<Ariakit.Toolbar
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
