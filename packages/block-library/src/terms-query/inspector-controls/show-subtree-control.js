/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalToolsPanelItem as ToolsPanelItem,
	ToggleControl,
} from '@wordpress/components';

export default function ShowSubtreeControl( {
	termsSelection,
	setAttributes,
} ) {
	return (
		<ToolsPanelItem
			hasValue={ () => termsSelection !== 'subtree' }
			label={ __( 'Show subtree only' ) }
			onDeselect={ () => setAttributes( { termsSelection: 'all' } ) }
			isShownByDefault
		>
			<ToggleControl
				__nextHasNoMarginBottom
				label={ __( 'Show subtree only' ) }
				checked={ termsSelection === 'substree' }
				onChange={ ( bool ) =>
					setAttributes( {
						termsSelection: bool ? 'subtree' : 'all',
					} )
				}
			/>
		</ToolsPanelItem>
	);
}
