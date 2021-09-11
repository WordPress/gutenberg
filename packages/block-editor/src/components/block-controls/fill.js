/**
 * External dependencies
 */
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	__experimentalStyleProvider as StyleProvider,
	__experimentalToolbarContext as ToolbarContext,
	ToolbarGroup,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import useBlockControlsFill from './hook';

export default function BlockControlsFill( {
	group = 'default',
	controls,
	children,
	__experimentalShareWithChildBlocks = false,
} ) {
	const Fill = useBlockControlsFill(
		group,
		__experimentalShareWithChildBlocks
	);
	if ( ! Fill ) {
		return null;
	}

	return (
		<StyleProvider document={ document }>
			<Fill>
				{ ( fillProps ) => {
					// Children passed to BlockControlsFill will not have access to any
					// React Context whose Provider is part of the BlockControlsSlot tree.
					// So we re-create the Provider in this subtree.
					const value = ! isEmpty( fillProps ) ? fillProps : null;
					return (
						<ToolbarContext.Provider value={ value }>
							{ group === 'default' && (
								<ToolbarGroup controls={ controls } />
							) }
							{ children }
						</ToolbarContext.Provider>
					);
				} }
			</Fill>
		</StyleProvider>
	);
}
