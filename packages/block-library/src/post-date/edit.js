/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { dateI18n, format as formatDate } from '@wordpress/date';
import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, SelectControl } from '@wordpress/components';

const formats = {
	date: 'd/m/Y',
	datetime: 'd/m/Y g:i',
};

export default function PostDateEdit( {
	attributes: { date, format },
	setAttributes,
} ) {
	return <>

		<InspectorControls>
			<PanelBody title={ __( 'Date Format' ) }>
				<SelectControl
					label="Select Control"
					value={ format }
					options={
						[
							{ value: 'date', label: __( 'Date' ) },
							{ value: 'datetime', label: __( 'Date & Time' ) },
						]
					}
					onChange={ ( value ) => setAttributes( { format: value } ) }
				/>
			</PanelBody>
		</InspectorControls>
		<time dateTime={ formatDate( 'c', date ) }>
			{ dateI18n( formats[ format ], date ) }
		</time>
	</>;
}
