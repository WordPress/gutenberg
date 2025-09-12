/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalToolsPanelItem as ToolsPanelItem,
	ToggleControl,
} from '@wordpress/components';

export default function DisplayOptions( { attributes, setQuery } ) {
	const { termQuery } = attributes;

	return (
		<>
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
						if ( hierarchical && termQuery.parent ) {
							setQuery( { parent: 0 } );
						}
					} }
					disabled={ termQuery.parent === 0 }
				/>
			</ToolsPanelItem>
		</>
	);
}
