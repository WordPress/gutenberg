/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalToolsPanelItem as ToolsPanelItem,
	ToggleControl,
} from '@wordpress/components';

export default function HierarchyControl( { attributes, setQuery } ) {
	const { termQuery } = attributes;

	return (
		<ToolsPanelItem
			hasValue={ () => termQuery.hierarchical !== false }
			label={ __( 'Show hierarchy' ) }
			onDeselect={ () => setQuery( { hierarchical: false } ) }
			isShownByDefault
		>
			<ToggleControl
				__nextHasNoMarginBottom
				label={ __( 'Show hierarchy' ) }
				checked={ termQuery.hierarchical }
				onChange={ ( hierarchical ) => {
					setQuery( { hierarchical } );
				} }
			/>
		</ToolsPanelItem>
	);
}
