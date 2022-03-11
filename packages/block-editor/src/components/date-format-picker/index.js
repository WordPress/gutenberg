/**
 * External dependencies
 */
import { uniq } from 'lodash';

/**
 * WordPress dependencies
 */
import { _x, __ } from '@wordpress/i18n';
import { dateI18n } from '@wordpress/date';
import { useState, createInterpolateElement } from '@wordpress/element';
import {
	TextControl,
	ExternalLink,
	VisuallyHidden,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	CustomSelectControl,
	BaseControl,
} from '@wordpress/components';

// So that we can illustrate the different formats in the dropdown properly,
// show a date that has a day greater than 12 and a month with more than three
// letters. Here we're using 2022-01-25 which is when WordPress 5.9 was
// released.
const EXAMPLE_DATE = new Date( 2022, 0, 25 );

/**
 * The `DateFormatPicker` component renders controls that let the user choose a
 * _date format_. That is, how they want their dates to be formatted.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/date-format-picker/README.md
 *
 * @param {Object}                          props
 * @param {string|null}                     props.format        The selected date
 *                                                              format.
 * @param {string}                          props.defaultFormat The date format that
 *                                                              will be used if the
 *                                                              user selects
 *                                                              'Default'.
 * @param {( format: string|null ) => void} props.onChange      Called when a
 *                                                              selection is made.
 */
export default function DateFormatPicker( {
	format,
	defaultFormat,
	onChange,
} ) {
	return (
		<fieldset className="block-editor-date-format-picker">
			<VisuallyHidden as="legend">{ __( 'Date format' ) }</VisuallyHidden>
			<div className="block-editor-date-format-picker__header">
				{ __( 'Format' ) }
				<span className="block-editor-date-format-picker__header__hint">
					{ dateI18n( format || defaultFormat, EXAMPLE_DATE ) }
				</span>
			</div>
			<ToggleGroupControl
				label={ __( 'Date format' ) }
				isBlock
				hideLabelFromVision
				value={ format ? 'custom' : 'default' }
				onChange={ ( value ) => {
					if ( value === 'default' ) {
						onChange( null );
					} else if ( value === 'custom' ) {
						onChange( defaultFormat );
					}
				} }
			>
				<ToggleGroupControlOption
					value="default"
					label={ __( 'Default' ) }
				/>
				<ToggleGroupControlOption
					value="custom"
					label={ __( 'Custom' ) }
				/>
			</ToggleGroupControl>
			{ format && (
				<CustomControls format={ format } onChange={ onChange } />
			) }
		</fieldset>
	);
}

function CustomControls( { format, onChange } ) {
	// Suggest a short format, medium format, long format, and a standardised
	// (YYYY-MM-DD) format. The short, medium, and long formats are localised as
	// different languages have different ways of writing these. For example, 'F
	// j, Y' (April 20, 2022) in American English (en_US) is 'j. F Y' (20. April
	// 2022) in German (de). The resultant array is de-duplicated as some
	// languages will use the same format string for short, medium, and long
	// formats.
	const suggestedFormats = uniq( [
		'Y-m-d',
		_x( 'n/j/Y', 'short date format' ),
		_x( 'n/j/Y g:i A', 'short date format with time' ),
		_x( 'M j, Y', 'medium date format' ),
		_x( 'M j, Y g:i A', 'medium date format with time' ),
		_x( 'F j, Y', 'long date format' ),
	] );

	const suggestedOptions = suggestedFormats.map(
		( suggestedFormat, index ) => ( {
			key: `suggested-${ index }`,
			name: dateI18n( suggestedFormat, EXAMPLE_DATE ),
			format: suggestedFormat,
		} )
	);
	const otherOption = {
		key: 'other',
		name: __( 'Other' ),
		className:
			'block-editor-date-format-picker__custom-format-select-control__other-option',
		__experimentalHint: __( 'Enter your own date format' ),
	};

	const [ isOther, setIsOther ] = useState(
		() => !! format && ! suggestedFormats.includes( format )
	);

	return (
		<>
			<BaseControl className="block-editor-date-format-picker__custom-format-select-control">
				<CustomSelectControl
					label={ __( 'Choose a format' ) }
					options={ [ ...suggestedOptions, otherOption ] }
					value={
						isOther
							? otherOption
							: suggestedOptions.find(
									( option ) => option.format === format
							  ) ?? otherOption
					}
					onChange={ ( { selectedItem } ) => {
						if ( selectedItem === otherOption ) {
							setIsOther( true );
						} else {
							setIsOther( false );
							onChange( selectedItem.format );
						}
					} }
				/>
			</BaseControl>
			{ isOther && (
				<TextControl
					label={ __( 'Format string' ) }
					hideLabelFromVision
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
