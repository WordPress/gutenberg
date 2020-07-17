/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';
import { useState } from '@wordpress/element';
import { __experimentalGetSettings, dateI18n } from '@wordpress/date';
import {
	AlignmentToolbar,
	BlockControls,
	InspectorControls,
	__experimentalBlock as Block,
} from '@wordpress/block-editor';
import {
	ToolbarGroup,
	ToolbarButton,
	Popover,
	DateTimePicker,
	PanelBody,
	CustomSelectControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function PostDateEdit( { attributes, context, setAttributes } ) {
	const { align, format } = attributes;
	const { postId, postType } = context;

	const [ siteFormat ] = useEntityProp( 'root', 'site', 'date_format' );
	const [ date, setDate ] = useEntityProp(
		'postType',
		postType,
		'date',
		postId
	);
	const [ isPickerOpen, setIsPickerOpen ] = useState( false );
	const settings = __experimentalGetSettings();
	// To know if the current time format is a 12 hour time, look for "a".
	// Also make sure this "a" is not escaped by a "/".
	const is12Hour = /a(?!\\)/i.test(
		settings.formats.time
			.toLowerCase() // Test only for the lower case "a".
			.replace( /\\\\/g, '' ) // Replace "//" with empty strings.
			.split( '' )
			.reverse()
			.join( '' ) // Reverse the string and test for "a" not followed by a slash.
	);
	const formatOptions = Object.values( settings.formats ).map(
		( formatOption ) => ( {
			key: formatOption,
			name: dateI18n( formatOption, date ),
		} )
	);
	const resolvedFormat = format || siteFormat || settings.formats.date;

	return (
		<>
			<BlockControls>
				<AlignmentToolbar
					value={ align }
					onChange={ ( nextAlign ) => {
						setAttributes( { align: nextAlign } );
					} }
				/>

				{ date && (
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
				) }
			</BlockControls>

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

			<Block.div
				className={ classnames( {
					[ `has-text-align-${ align }` ]: align,
				} ) }
			>
				{ date && (
					<time dateTime={ dateI18n( 'c', date ) }>
						{ dateI18n( resolvedFormat, date ) }

						{ isPickerOpen && (
							<Popover
								onClose={ setIsPickerOpen.bind( null, false ) }
							>
								<DateTimePicker
									currentDate={ date }
									onChange={ setDate }
									is12Hour={ is12Hour }
								/>
							</Popover>
						) }
					</time>
				) }
				{ ! date && __( 'No Date' ) }
			</Block.div>
		</>
	);
}
