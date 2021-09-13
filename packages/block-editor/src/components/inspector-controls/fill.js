/**
 * WordPress dependencies
 */
import { __experimentalStyleProvider as StyleProvider } from '@wordpress/components';
import warning from '@wordpress/warning';

/**
 * Internal dependencies
 */
import BlockSupportToolsPanel from './block-support-tools-panel';
import useDisplayBlockControls from '../use-display-block-controls';
import groups from './groups';

export default function InspectorControlsFill( {
	__experimentalGroup: group = 'default',
	children,
} ) {
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
					// Check if the fills here represent the contents of a
					// block support panel and require a wrapping ToolsPanel.
					const { label } = fillProps;

					if ( ! label ) {
						return children;
					}

					return (
						<BlockSupportToolsPanel label={ label }>
							{ children }
						</BlockSupportToolsPanel>
					);
				} }
			</Fill>
		</StyleProvider>
	);
}
