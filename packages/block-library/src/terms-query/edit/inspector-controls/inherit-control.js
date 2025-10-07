/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalToolsPanelItem as ToolsPanelItem,
	ToggleControl,
} from '@wordpress/components';

export default function InheritControl( { attributes, setAttributes } ) {
	const { termQuery } = attributes;

	return (
		<ToolsPanelItem
			hasValue={ () => termQuery.inherit !== false }
			label={ __( 'Inherit parent term from archive' ) }
			onDeselect={ () => setAttributes( { inherit: false } ) }
			isShownByDefault
		>
			<ToggleControl
				__nextHasNoMarginBottom
				label={ __( 'Inherit parent term from archive' ) }
				checked={ termQuery.inherit }
				onChange={ ( inherit ) => {
					setAttributes( { termQuery: { ...termQuery, inherit } } );
				} }
			/>
		</ToolsPanelItem>
	);
}
