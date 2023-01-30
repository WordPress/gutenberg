/**
 * External dependencies
 */
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	__experimentalStyleProvider as StyleProvider,
	__experimentalToolsPanelContext as ToolsPanelContext,
} from '@wordpress/components';
import warning from '@wordpress/warning';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import useDisplayBlockControls from '../use-display-block-controls';
import groups from './groups';

export default function InspectorControlsFill( {
	children,
	group = 'default',
	__experimentalGroup,
} ) {
	if ( __experimentalGroup ) {
		deprecated(
			'`__experimentalGroup` property in `InspectorControlsFill`',
			{
				since: '6.2',
				version: '6.4',
				alternative: '`group`',
			}
		);
		group = __experimentalGroup;
	}

	const isDisplayed = useDisplayBlockControls();
	const Fill = groups[ group ]?.Fill;
	if ( ! Fill ) {
		warning( `Unknown InspectorControl group "${ group }" provided.` );
		return null;
	}
	if ( ! isDisplayed ) {
		return null;
	}

	return (
		<StyleProvider document={ document }>
			<Fill>
				{ ( fillProps ) => {
					// Children passed to InspectorControlsFill will not have
					// access to any React Context whose Provider is part of
					// the InspectorControlsSlot tree. So we re-create the
					// Provider in this subtree.
					const value = ! isEmpty( fillProps ) ? fillProps : null;
					return (
						<ToolsPanelContext.Provider value={ value }>
							{ children }
						</ToolsPanelContext.Provider>
					);
				} }
			</Fill>
		</StyleProvider>
	);
}
