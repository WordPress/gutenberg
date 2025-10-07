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
			label={ __( 'Include nested terms' ) }
			onDeselect={ () => setQuery( { hierarchical: false } ) }
			isShownByDefault
		>
			<ToggleControl
				__nextHasNoMarginBottom
				label={ __( 'Include nested terms' ) }
				checked={ termQuery.hierarchical }
				onChange={ ( hierarchical ) => {
					setQuery( { hierarchical } );
				} }
			/>
		</ToolsPanelItem>
	);
}
