/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalToolsPanelItem as ToolsPanelItem,
	RadioControl,
} from '@wordpress/components';

export default function DisplayOptions( { attributes, setQuery } ) {
	const { termQuery } = attributes;

	return (
		<>
			<ToolsPanelItem
				hasValue={ () => termQuery.parent !== false }
				label={ __( 'Terms to show' ) }
				onDeselect={ () => setQuery( { parent: false } ) }
				isShownByDefault
			>
				<RadioControl
					__nextHasNoMarginBottom
					label={ __( 'Terms to show' ) }
					options={ [
						{ label: __( 'Show all' ), value: false },
						{ label: __( 'Show only top level terms' ), value: 0 },
					] }
					selected={ termQuery.parent }
					onChange={ ( parent ) => {
						setQuery( { parent } );
						if ( parent === 0 && termQuery.hierarchical ) {
							setQuery( { hierarchical: false } );
						}
					} }
					disabled={ !! termQuery.hierarchical }
				/>
			</ToolsPanelItem>
		</>
	);
}
