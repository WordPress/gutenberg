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
import useDisplayBlockControls from '../use-display-block-controls';
import groups from './groups';

export default function BlockControlsFill( {
	group = 'default',
	controls,
	children,
} ) {
	if ( ! useDisplayBlockControls() ) {
		return null;
	}
	const Fill = groups[ group ].Fill;

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
