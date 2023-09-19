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
	CustomSelectControl,
	ToggleControl,
	__experimentalVStack as VStack,
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
 *                                                              format. If
 *                                                              `null`,
 *                                                              _Default_ is
 *                                                              selected.
 * @param {string}                          props.defaultFormat The date format that
 *                                                              will be used if the
 *                                                              user selects
 *                                                              'Default'.
 * @param {( format: string|null ) => void} props.onChange      Called when a
 *                                                              selection is
 *                                                              made. If `null`,
 *                                                              _Default_ is
 *                                                              selected.
 */
export default function DateFormatPicker( {
	format,
	defaultFormat,
	onChange,
} ) {
	return (
		<fieldset className="block-editor-date-format-picker">
			<VisuallyHidden as="legend">{ __( 'Date format' ) }</VisuallyHidden>
			<ToggleControl
				__nextHasNoMarginBottom
				label={ __( 'Default format' ) }
				help={ `${ __( 'Example:' ) }  ${ dateI18n(
					defaultFormat,
					EXAMPLE_DATE
				) }` }
				checked={ ! format }
				onChange={ ( checked ) =>
					onChange( checked ? null : defaultFormat )
				}
			/>
			{ format && (
				<NonDefaultControls format={ format } onChange={ onChange } />
			) }
		</fieldset>
	);
}

function NonDefaultControls( { format, onChange } ) {
	// Suggest a short format, medium format, long format, and a standardised
	// (YYYY-MM-DD) format. The short, medium, and long formats are localised as
	// different languages have different ways of writing these. For example, 'F
	// j, Y' (April 20, 2022) in American English (en_US) is 'j. F Y' (20. April
	// 2022) in German (de). The resultant array is de-duplicated as some
	// languages will use the same format string for short, medium, and long
	// formats.
	const suggestedFormats = [
		...new Set( [
			'Y-m-d',
			_x( 'n/j/Y', 'short date format' ),
			_x( 'n/j/Y g:i A', 'short date format with time' ),
			_x( 'M j, Y', 'medium date format' ),
			_x( 'M j, Y g:i A', 'medium date format with time' ),
			_x( 'F j, Y', 'long date format' ),
			_x( 'M j', 'short date format without the year' ),
		] ),
	];

	const suggestedOptions = suggestedFormats.map(
		( suggestedFormat, index ) => ( {
			key: `suggested-${ index }`,
			name: dateI18n( suggestedFormat, EXAMPLE_DATE ),
			format: suggestedFormat,
		} )
	);
	const customOption = {
		key: 'custom',
		name: __( 'Custom' ),
		className:
			'block-editor-date-format-picker__custom-format-select-control__custom-option',
		__experimentalHint: __( 'Enter your own date format' ),
	};

	const [ isCustom, setIsCustom ] = useState(
		() => !! format && ! suggestedFormats.includes( format )
	);

	return (
		<VStack>
			<CustomSelectControl
				__nextUnconstrainedWidth
				label={ __( 'Choose a format' ) }
				options={ [ ...suggestedOptions, customOption ] }
				value={
					isCustom
						? customOption
						: suggestedOptions.find(
								( option ) => option.format === format
						  ) ?? customOption
				}
				onChange={ ( { selectedItem } ) => {
					if ( selectedItem === customOption ) {
						setIsCustom( true );
					} else {
						setIsCustom( false );
						onChange( selectedItem.format );
					}
				} }
			/>
			{ isCustom && (
				<TextControl
					__nextHasNoMarginBottom
					label={ __( 'Custom format' ) }
					hideLabelFromVision
					help={ createInterpolateElement(
						__(
							'Enter a date or time <Link>format string</Link>.'
						),
						{
							Link: (
								<ExternalLink
									href={ __(
										'https://wordpress.org/documentation/article/customize-date-and-time-format/'
									) }
								/>
							),
						}
					) }
					value={ format }
					onChange={ ( value ) => onChange( value ) }
				/>
			) }
		</VStack>
	);
}
