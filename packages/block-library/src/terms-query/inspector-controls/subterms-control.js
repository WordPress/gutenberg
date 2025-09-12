/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalToolsPanelItem as ToolsPanelItem,
	ToggleControl,
} from '@wordpress/components';

export default function SubtreeControl( { attributes, setAttributes } ) {
	const { showSubterms } = attributes;
	return (
		<ToolsPanelItem
			hasValue={ () => false }
			label={ __( 'Show subterms only' ) }
			onDeselect={ () => setAttributes( { showSubterms: false } ) }
			isShownByDefault
		>
			<ToggleControl
				__nextHasNoMarginBottom
				label={ __( 'Show subterms only' ) }
				checked={ showSubterms }
				onChange={ ( value ) => {
					setAttributes( { showSubterms: value } );
				} }
			/>
		</ToolsPanelItem>
	);
}
