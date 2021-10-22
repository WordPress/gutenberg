/**
 * WordPress dependencies
 */
import {
	CustomSelectControl,
	TextControl,
	PanelRow,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useDateFormatOptions, useDateFormat } from './util';

export default function DateFormatControls( { format, setFormat, date } ) {
	const formatOptions = useDateFormatOptions( date );
	const resolvedFormat = useDateFormat( format );

	const [ selectedFormat, setSelectedFormat ] = useState(
		formatOptions[ resolvedFormat ] ? resolvedFormat : 'custom'
	);

	return (
		<>
			<PanelRow>
				<CustomSelectControl
					hideLabelFromVision
					label={ __( 'Date Format' ) }
					options={ Object.values( formatOptions ) }
					onChange={ ( { selectedItem } ) => {
						if ( selectedItem.key !== 'custom' ) {
							setFormat( selectedItem.key );
						}
						setSelectedFormat( selectedItem.key );
					} }
					value={ formatOptions[ selectedFormat ] }
				/>
			</PanelRow>
			{ selectedFormat === 'custom' && (
				<PanelRow>
					<TextControl
						label={ __( 'Custom format' ) }
						value={ format }
						onChange={ setFormat }
					/>
				</PanelRow>
			) }
		</>
	);
}
