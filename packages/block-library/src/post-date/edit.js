/**
 * External dependencies
 */
import classnames from 'classnames';
import { uniq } from 'lodash';

/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';
import { useRef, useState, createInterpolateElement } from '@wordpress/element';
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
	SelectControl,
	TextControl,
	ExternalLink,
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
	const blockProps = useBlockProps( {
		className: classnames( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
	} );

	const timeRef = useRef();

	let postDate = date ? (
		<time dateTime={ dateI18n( 'c', date ) } ref={ timeRef }>
			{ dateI18n( format || siteFormat, date ) }
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
				<FormatSettings
					date={ date }
					format={ format }
					siteFormat={ siteFormat }
					setFormat={ ( nextFormat ) =>
						setAttributes( { format: nextFormat } )
					}
				/>
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

function FormatSettings( { date, format, siteFormat, setFormat } ) {
	// Suggest a short format, medium format, long format, and a standardised
	// (YYYY-MM-DD) format. The short, medium, and long formats are localised as
	// different languages have different ways of writing these. For example, 'F
	// j, Y' (April 20, 2022) in American English (en_US) is 'j. F Y' (20. April
	// 2022) in German (de). The resultant array is de-duplicated as some
	// languages will use the same format string for short, medium, and long
	// formats.
	const suggestedFormats = uniq( [
		_x( 'n/j/Y', 'short date format' ),
		_x( 'F j, Y', 'medium date format' ),
		_x( 'l, F j, Y', 'long date format' ),
		_x( 'n/j/Y h:i A', 'short date format with time' ),
		_x( 'F j, Y h:i A', 'medium date format with time' ),
		'Y-m-d',
	] );

	const defaultOption = {
		label: sprintf(
			// translators: %s: Example of how the date will look if selected.
			_x( 'Site default (%s)', 'date format option' ),
			dateI18n( siteFormat, date )
		),
	};
	const suggestedOptions = suggestedFormats.map( ( suggestedFormat ) => ( {
		format: suggestedFormat,
		label: dateI18n( suggestedFormat, date ),
	} ) );
	const customOption = {
		label: _x( 'Custom', 'date format option' ),
	};
	const options = [ defaultOption, ...suggestedOptions, customOption ];

	const [ isCustom, setIsCustom ] = useState(
		() => !! format && ! suggestedFormats.includes( format )
	);

	let selectedOption;
	if ( isCustom ) {
		selectedOption = customOption;
	} else if ( format ) {
		selectedOption =
			suggestedOptions.find(
				( suggestedOption ) => suggestedOption.format === format
			) ?? customOption;
	} else {
		selectedOption = defaultOption;
	}

	return (
		<PanelBody title={ __( 'Format settings' ) }>
			<SelectControl
				label={ __( 'Date format' ) }
				options={ options.map( ( option, index ) => ( {
					value: index,
					label: option.label,
				} ) ) }
				value={ options.indexOf( selectedOption ) }
				onChange={ ( value ) => {
					const option = options[ value ];
					if ( option === defaultOption ) {
						setFormat( null );
						setIsCustom( false );
					} else if ( option === customOption ) {
						setFormat( format ?? siteFormat );
						setIsCustom( true );
					} else {
						setFormat( option.format );
						setIsCustom( false );
					}
				} }
			/>
			{ isCustom && (
				<TextControl
					label={ __( 'Custom format' ) }
					help={ createInterpolateElement(
						__(
							'Enter a date or time <Link>format string</Link>.'
						),
						{
							Link: (
								<ExternalLink
									href={ __(
										'https://wordpress.org/support/article/formatting-date-and-time/'
									) }
								/>
							),
						}
					) }
					value={ format }
					onChange={ ( value ) => setFormat( value ) }
				/>
			) }
		</PanelBody>
	);
}
