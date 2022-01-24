/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';
import { useRef } from '@wordpress/element';
import { __experimentalGetSettings, dateI18n } from '@wordpress/date';
import {
	AlignmentControl,
	BlockControls,
	InspectorControls,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	Dropdown,
	ToolbarGroup,
	ToolbarButton,
	ToggleControl,
	DateTimePicker,
	PanelBody,
	CustomSelectControl,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { edit } from '@wordpress/icons';
import { DOWN } from '@wordpress/keycodes';

export default function PostDateEdit( {
	attributes: { textAlign, format, isLink },
	context: { postId, postType, queryId },
	setAttributes,
} ) {
	const isDescendentOfQueryLoop = Number.isFinite( queryId );
	const [ siteFormat ] = useEntityProp( 'root', 'site', 'date_format' );
	const [ date, setDate ] = useEntityProp(
		'postType',
		postType,
		'date',
		postId
	);
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
	const blockProps = useBlockProps( {
		className: classnames( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
	} );

	const timeRef = useRef();

	let postDate = date ? (
		<time dateTime={ dateI18n( 'c', date ) } ref={ timeRef }>
			{ dateI18n( resolvedFormat, date ) }
		</time>
	) : (
		__( 'Post Date' )
	);
	if ( isLink && date ) {
		postDate = (
			<a
				href="#post-date-pseudo-link"
				onClick={ ( event ) => event.preventDefault() }
			>
				{ postDate }
			</a>
		);
	}
	return (
		<>
			<BlockControls group="block">
				<AlignmentControl
					value={ textAlign }
					onChange={ ( nextAlign ) => {
						setAttributes( { textAlign: nextAlign } );
					} }
				/>

				{ date && ! isDescendentOfQueryLoop && (
					<ToolbarGroup>
						<Dropdown
							popoverProps={ { anchorRef: timeRef.current } }
							renderContent={ () => (
								<DateTimePicker
									currentDate={ date }
									onChange={ setDate }
									is12Hour={ is12Hour }
								/>
							) }
							renderToggle={ ( { isOpen, onToggle } ) => {
								const openOnArrowDown = ( event ) => {
									if ( ! isOpen && event.keyCode === DOWN ) {
										event.preventDefault();
										onToggle();
									}
								};
								return (
									<ToolbarButton
										aria-expanded={ isOpen }
										icon={ edit }
										title={ __( 'Change Date' ) }
										onClick={ onToggle }
										onKeyDown={ openOnArrowDown }
									/>
								);
							} }
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
				<PanelBody title={ __( 'Link settings' ) }>
					<ToggleControl
						label={ sprintf(
							// translators: %s: Name of the post type e.g: "post".
							__( 'Link to %s' ),
							postType
						) }
						onChange={ () => setAttributes( { isLink: ! isLink } ) }
						checked={ isLink }
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>{ postDate }</div>
		</>
	);
}
