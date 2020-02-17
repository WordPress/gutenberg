/**
 * WordPress dependencies
 */
import { useEntityProp, useEntityId } from '@wordpress/core-data';
import { useState } from '@wordpress/element';
import { __experimentalGetSettings, dateI18n } from '@wordpress/date';
import { BlockControls, InspectorControls } from '@wordpress/block-editor';
import {
	ToolbarGroup,
	ToolbarButton,
	Popover,
	DateTimePicker,
	PanelBody,
	CustomSelectControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

function PostDateEditor( { format, setAttributes } ) {
	const [ siteFormat ] = useEntityProp( 'root', 'site', 'date_format' );
	const [ date, setDate ] = useEntityProp( 'postType', 'post', 'date' );
	const [ isPickerOpen, setIsPickerOpen ] = useState( false );
	const settings = __experimentalGetSettings();
	const is12Hour = /a(?!\\)/i.test(
		settings.formats.time
			.toLowerCase()
			.replace( /\\\\/g, '' )
			.split( '' )
			.reverse()
			.join( '' )
	);
	const formatOptions = Object.keys( settings.formats ).map(
		( formatKey ) => ( {
			key: settings.formats[ formatKey ],
			name: dateI18n( settings.formats[ formatKey ], date ),
		} )
	);
	const resolvedFormat = format || siteFormat || settings.formats.date;
	return date ? (
		<time dateTime={ dateI18n( 'c', date ) }>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton
						icon="edit"
						title={ __( 'Change Date' ) }
						onClick={ () =>
							setIsPickerOpen(
								( _isPickerOpen ) => ! _isPickerOpen
							)
						}
					/>
				</ToolbarGroup>
			</BlockControls>
			{ dateI18n( resolvedFormat, date ) }
			{ isPickerOpen && (
				<Popover onClose={ setIsPickerOpen.bind( null, false ) }>
					<DateTimePicker
						currentDate={ date }
						onChange={ setDate }
						is12Hour={ is12Hour }
					/>
				</Popover>
			) }
			<InspectorControls>
				<PanelBody title={ __( 'Format settings' ) }>
					<CustomSelectControl
						hideLabelFromVision
						label={ __( 'Date Format' ) }
						options={ formatOptions }
						onChange={ ( { selectedItem } ) =>
							setAttributes( {
								format: selectedItem.key,
							} )
						}
						value={ formatOptions.find(
							( option ) => option.key === resolvedFormat
						) }
					/>
				</PanelBody>
			</InspectorControls>
		</time>
	) : (
		__( 'No Date' )
	);
}

export default function PostDateEdit( {
	attributes: { format },
	setAttributes,
} ) {
	if ( ! useEntityId( 'postType', 'post' ) ) {
		return 'Post Date Placeholder';
	}
	return <PostDateEditor format={ format } setAttributes={ setAttributes } />;
}
