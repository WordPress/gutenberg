/**
 * External dependencies
 */
import { uniq } from 'lodash';

/**
 * WordPress dependencies
 */
import { _x, sprintf, __ } from '@wordpress/i18n';
import { dateI18n } from '@wordpress/date';
import { useState, createInterpolateElement } from '@wordpress/element';
import {
	SelectControl,
	TextControl,
	ExternalLink,
} from '@wordpress/components';

/**
 * So that we can illustrate the different formats in the dropdown properly,
 * show a date that has a day greater than 12 and a month with more than three
 * letters. Here we're using 2022-01-25 which is when WordPress 5.9 was
 * released.
 */
const EXAMPLE_DATE = new Date( 2022, 0, 25 );

/**
 * The `DateFormatControl` component renders a dropdown that lets the user
 * choose a _date format_. That is, how they want their dates to be formatted.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/date-format-control/README.md
 *
 * @param {Object}                     props
 * @param {string|null}                props.format     The selected date
 *                                                      format.
 * @param {string}                     props.siteFormat The site's date format,
 *                                                      used to show what the
 *                                                      date will look like if
 *                                                      user selects _Site
 *                                                      default_.
 * @param {( format: string ) => void} props.onChange   Called when a selection
 *                                                      is made.
 */
export default function DateFormatControl( { format, siteFormat, onChange } ) {
	// Suggest a short format, medium format, long format, and a standardised
	// (YYYY-MM-DD) format. The short, medium, and long formats are localised as
	// different languages have different ways of writing these. For example, 'F
	// j, Y' (April 20, 2022) in American English (en_US) is 'j. F Y' (20. April
	// 2022) in German (de). The resultant array is de-duplicated as some
	// languages will use the same format string for short, medium, and long
	// formats.
	const suggestedFormats = uniq( [
		_x( 'n/j/Y', 'short date format' ),
		_x( 'M j, Y', 'medium date format' ),
		_x( 'F j, Y', 'long date format' ),
		_x( 'l, F j, Y', 'full date format' ),
		_x( 'n/j/Y g:i A', 'short date format with time' ),
		_x( 'M j, Y g:i A', 'medium date format with time' ),
		_x( 'F j, Y g:i A', 'long date format with time' ),
		'Y-m-d',
	] );

	const defaultOption = {
		label: sprintf(
			// translators: %s: Example of how the date will look if selected.
			_x( 'Site default (%s)', 'date format option' ),
			dateI18n( siteFormat, EXAMPLE_DATE )
		),
	};
	const suggestedOptions = suggestedFormats.map( ( suggestedFormat ) => ( {
		format: suggestedFormat,
		label: dateI18n( suggestedFormat, EXAMPLE_DATE ),
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
		<>
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
						onChange( null );
						setIsCustom( false );
					} else if ( option === customOption ) {
						onChange( format ?? siteFormat );
						setIsCustom( true );
					} else {
						onChange( option.format );
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
					onChange={ ( value ) => onChange( value ) }
				/>
			) }
		</>
	);
}
