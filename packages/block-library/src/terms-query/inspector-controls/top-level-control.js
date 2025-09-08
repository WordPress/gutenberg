/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalToolsPanelItem as ToolsPanelItem,
	ToggleControl,
} from '@wordpress/components';

export default function TopLevelControl( { termQuery, setQuery } ) {
	return (
		<ToolsPanelItem
			hasValue={ () => termQuery.parent !== 0 }
			label={ __( 'Show only top level terms' ) }
			onDeselect={ () => setQuery( { parent: 0 } ) }
			isShownByDefault
		>
			<ToggleControl
				__nextHasNoMarginBottom
				label={ __( 'Show only top level terms' ) }
				checked={ termQuery.parent === 0 }
				onChange={ ( showTopLevel ) => {
					setQuery( {
						parent: showTopLevel ? 0 : undefined,
					} );
					if ( showTopLevel && termQuery.hierarchical ) {
						setQuery( { hierarchical: false } );
					}
				} }
				disabled={ !! termQuery.hierarchical }
			/>
		</ToolsPanelItem>
	);
}
