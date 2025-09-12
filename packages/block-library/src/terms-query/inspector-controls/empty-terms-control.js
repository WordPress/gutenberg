/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalToolsPanelItem as ToolsPanelItem,
	ToggleControl,
} from '@wordpress/components';

export default function EmptyTermsControl( { attributes, setQuery } ) {
	const { termQuery } = attributes;

	return (
		<ToolsPanelItem
			hasValue={ () => termQuery.hideEmpty !== true }
			label={ __( 'Show empty terms' ) }
			onDeselect={ () => setQuery( { hideEmpty: true } ) }
			isShownByDefault
		>
			<ToggleControl
				__nextHasNoMarginBottom
				label={ __( 'Show empty terms' ) }
				checked={ ! termQuery.hideEmpty }
				onChange={ ( showEmpty ) =>
					setQuery( { hideEmpty: ! showEmpty } )
				}
			/>
		</ToolsPanelItem>
	);
}
