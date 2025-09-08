/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalToolsPanelItem as ToolsPanelItem,
	ToggleControl,
} from '@wordpress/components';

export default function ShowSubtreeControl( {
	showSubtreeOnly,
	setAttributes,
} ) {
	return (
		<ToolsPanelItem
			hasValue={ () => showSubtreeOnly !== false }
			label={ __( 'Show subtree only' ) }
			onDeselect={ () => setAttributes( { termsSelection: 'all' } ) }
			isShownByDefault
		>
			<ToggleControl
				__nextHasNoMarginBottom
				label={ __( 'Show subtree only' ) }
				checked={ showSubtreeOnly }
				onChange={ ( bool ) =>
					setAttributes( {
						termsSelection: bool ? 'subtree' : 'all',
					} )
				}
			/>
		</ToolsPanelItem>
	);
}
