/**
 * External dependencies
 */
import classnames from 'classnames';
import { uniq } from 'lodash';

/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';
import { useRef } from '@wordpress/element';
import { dateI18n } from '@wordpress/date';
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
import { __, _x, sprintf } from '@wordpress/i18n';
import { edit } from '@wordpress/icons';
import { DOWN } from '@wordpress/keycodes';

export default function PostDateEdit( {
	attributes: { textAlign, format, isLink },
	context: { postId, postType, queryId },
	setAttributes,
} ) {
	const isDescendentOfQueryLoop = Number.isFinite( queryId );
	const [ siteFormat ] = useEntityProp( 'root', 'site', 'date_format' );
	const [ timeFormat ] = useEntityProp( 'root', 'site', 'time_format' );
	const [ date, setDate ] = useEntityProp(
		'postType',
		postType,
		'date',
		postId
	);
	// To know if the time format is a 12 hour time, look for any of the 12 hour
	// format characters: 'a', 'A', 'g', and 'h'. The character must be
	// unescaped, i.e. not preceded by a '\'. Coincidentally, 'aAgh' is how I
	// feel when working with regular expressions.
	// https://www.php.net/manual/en/datetime.format.php
	const is12Hour = /(?:^|[^\\])[aAgh]/.test( timeFormat );
	const formatOptions = [
		{
			key: null,
			name: sprintf(
				// translators: %s: Example of how the date will look if selected.
				_x( 'Site default (%s)', 'date format option' ),
				dateI18n( siteFormat, date )
			),
		},
		// Suggest a short format, medium format, long format, and a
		// standardised (YYYY-MM-DD) format. The short, medium, and long formats
		// are localised as different languages have different ways of writing
		// these. For example, 'F j, Y' (April 20, 2022) in American English
		// (en_US) is 'j. F Y' (20. April 2022) in German (de). The resultant
		// array is de-duplicated as some languages will use the same format
		// string for short, medium, and long formats.
		...uniq( [
			_x( 'n/j/Y', 'short date format' ),
			_x( 'F j, Y', 'medium date format' ),
			_x( 'l, F j, Y', 'long date format' ),
			_x( 'n/j/Y h:i A', 'short date format with time' ),
			_x( 'F j, Y h:i A', 'medium date format with time' ),
			'Y-m-d',
		] ).map( ( suggestedFormat ) => ( {
			key: suggestedFormat,
			name: dateI18n( suggestedFormat, date ),
		} ) ),
	];
	const blockProps = useBlockProps( {
		className: classnames( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
	} );

	const timeRef = useRef();

	let postDate = date ? (
		<time dateTime={ dateI18n( 'c', date ) } ref={ timeRef }>
			{ dateI18n( format ?? siteFormat, date ) }
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
							( option ) => option.key === format
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
