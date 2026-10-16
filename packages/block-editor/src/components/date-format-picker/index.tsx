import { _x, __ } from '@wordpress/i18n';
import { dateI18n, humanTimeDiff } from '@wordpress/date';
import { useState, createInterpolateElement } from '@wordpress/element';
import {
	Fieldset,
	InputControl,
	Link,
	SelectControl,
	Stack,
	SwitchControl,
} from '@wordpress/ui';
import type { DateFormatPickerProps, NonDefaultControlsProps } from './types';

// So that we illustrate the different formats in the dropdown properly, show a date that is
// somewhat recent, has a day greater than 12, and a month with more than three letters.
const exampleDate = new Date();
exampleDate.setDate( 20 );
exampleDate.setMonth( exampleDate.getMonth() - 3 );
if ( exampleDate.getMonth() === 4 ) {
	// May has three letters, so use March.
	exampleDate.setMonth( 3 );
}

/**
 * The `DateFormatPicker` component renders controls that let the user choose a
 * _date format_. That is, how they want their dates to be formatted.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/date-format-picker/README.md
 *
 * @param props
 * @param props.format        The selected date format. If `null`, _Default_ is selected.
 * @param props.defaultFormat The date format that will be used if the user selects 'Default'.
 * @param props.onChange      Called when a selection is made. If `null`, _Default_ is selected.
 */
export default function DateFormatPicker( {
	format,
	defaultFormat,
	onChange,
}: DateFormatPickerProps ) {
	return (
		<Stack
			render={ <Fieldset.Root /> }
			direction="column"
			gap="lg"
			className="block-editor-date-format-picker"
		>
			<Fieldset.Legend hideFromVision>
				{ __( 'Date format' ) }
			</Fieldset.Legend>
			<SwitchControl
				label={ __( 'Default format' ) }
				description={ `${ __( 'Example:' ) }  ${ dateI18n(
					defaultFormat,
					exampleDate
				) }` }
				checked={ ! format }
				onCheckedChange={ ( checked ) =>
					onChange( checked ? null : defaultFormat )
				}
			/>
			{ format && (
				<NonDefaultControls format={ format } onChange={ onChange } />
			) }
		</Stack>
	);
}

function NonDefaultControls( { format, onChange }: NonDefaultControlsProps ) {
	// Suggest a short format, medium format, long format, and a standardised
	// (YYYY-MM-DD) format. The short, medium, and long formats are localised as
	// different languages have different ways of writing these. For example, 'F
	// j, Y' (April 20, 2022) in American English (en_US) is 'j. F Y' (20. April
	// 2022) in German (de). The resultant array is de-duplicated as some
	// languages will use the same format string for short, medium, and long
	// formats.
	const suggestedFormats = [
		...new Set( [
			/* translators: See https://www.php.net/manual/datetime.format.php */
			'Y-m-d',
			/* translators: See https://www.php.net/manual/datetime.format.php */
			_x( 'n/j/Y', 'short date format' ),
			/* translators: See https://www.php.net/manual/datetime.format.php */
			_x( 'n/j/Y g:i A', 'short date format with time' ),
			/* translators: See https://www.php.net/manual/datetime.format.php */
			_x( 'M j, Y', 'medium date format' ),
			/* translators: See https://www.php.net/manual/datetime.format.php */
			_x( 'M j, Y g:i A', 'medium date format with time' ),
			/* translators: See https://www.php.net/manual/datetime.format.php */
			_x( 'F j, Y', 'long date format' ),
			/* translators: See https://www.php.net/manual/datetime.format.php */
			_x( 'M j', 'short date format without the year' ),
		] ),
	];

	const suggestedOptions = [
		...suggestedFormats.map( ( suggestedFormat ) => ( {
			value: suggestedFormat,
			label: dateI18n( suggestedFormat, exampleDate ),
		} ) ),
		{
			value: 'human-diff',
			label: humanTimeDiff( exampleDate ),
		},
	];

	const customOption = {
		value: 'custom',
		label: __( 'Custom' ),
		description: __( 'Enter your own date format' ),
	};

	const [ isCustom, setIsCustom ] = useState(
		() =>
			!! format &&
			! suggestedOptions.some( ( option ) => option.value === format )
	);

	return (
		<Stack direction="column" gap="sm">
			<SelectControl
				label={ __( 'Choose a format' ) }
				items={ [ ...suggestedOptions, customOption ] }
				value={
					isCustom
						? customOption
						: ( suggestedOptions.find(
								( option ) => option.value === format
							) ?? customOption )
				}
				onValueChange={ ( selectedItem ) => {
					if ( ! selectedItem ) {
						return;
					}
					if ( selectedItem === customOption ) {
						setIsCustom( true );
					} else {
						setIsCustom( false );
						onChange( selectedItem.value );
					}
				} }
			>
				{ suggestedOptions.map( ( option ) => (
					<SelectControl.Item key={ option.value } value={ option }>
						<SelectControl.ItemLabel>
							{ option.label }
						</SelectControl.ItemLabel>
					</SelectControl.Item>
				) ) }
				<SelectControl.Separator />
				<SelectControl.Item value={ customOption }>
					<SelectControl.ItemLabel>
						{ customOption.label }
					</SelectControl.ItemLabel>
					<SelectControl.ItemDescription>
						{ customOption.description }
					</SelectControl.ItemDescription>
				</SelectControl.Item>
			</SelectControl>
			{ isCustom && (
				<InputControl
					label={ __( 'Custom format' ) }
					hideLabelFromVision
					details={ createInterpolateElement(
						__(
							'Enter a date or time <Link>format string</Link>.'
						),
						{
							Link: (
								<Link
									openInNewTab
									href={ __(
										'https://wordpress.org/documentation/article/customize-date-and-time-format/'
									) }
								/>
							),
						}
					) }
					value={ format }
					onValueChange={ ( value ) => onChange( value ) }
				/>
			) }
		</Stack>
	);
}
