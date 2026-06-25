/**
 * WordPress dependencies
 */
import { TextControl, SelectControl } from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { __ } from '@wordpress/i18n';

const META_TYPE_OPTIONS = [
	{ label: __( 'Text' ), value: 'CHAR' },
	{ label: __( 'Number' ), value: 'NUMERIC' },
	{ label: __( 'Date' ), value: 'DATE' },
];

const DATE_RANGE_OPTIONS = [
	{ label: __( 'Any date' ), value: '' },
	{ label: __( 'Upcoming (today and future)' ), value: 'future' },
	{ label: __( 'Past events' ), value: 'past' },
	{ label: __( 'Today only' ), value: 'today' },
	{ label: __( 'Custom range' ), value: 'custom' },
];

const COMPARE_OPTIONS = [
	{ label: __( 'Equals' ), value: '=' },
	{ label: __( 'Not Equals' ), value: '!=' },
	{ label: __( 'Contains' ), value: 'LIKE' },
	{ label: __( 'Greater Than' ), value: '>' },
	{ label: __( 'Less Than' ), value: '<' },
];

export default function MetaQueryControls( {
	metaKey,
	metaType,
	dateRange,
	metaDateStart,
	metaDateEnd,
	metaValue,
	metaCompare,
	onChange,
} ) {
	const isDateType = metaType === 'DATE';

	return (
		<Stack gap="lg" direction="column">
			<TextControl
				__next40pxDefaultSize
				label={ __( 'Meta field key' ) }
				help={ __( 'Enter the exact custom field key' ) }
				value={ metaKey }
				onChange={ ( value ) =>
					onChange( {
						metaKey: value,
						...( ! value && {
							metaType: 'CHAR',
							dateRange: '',
							metaDateStart: '',
							metaDateEnd: '',
							metaValue: '',
							metaCompare: '=',
						} ),
					} )
				}
			/>

			{ !! metaKey && (
				<>
					<SelectControl
						__next40pxDefaultSize
						label={ __( 'Field type' ) }
						value={ metaType }
						options={ META_TYPE_OPTIONS }
						onChange={ ( value ) =>
							onChange( {
								metaType: value,
								...( value !== 'DATE' && {
									dateRange: '',
									metaDateStart: '',
									metaDateEnd: '',
								} ),
								...( value === 'DATE' && { metaValue: '' } ),
							} )
						}
					/>

					{ isDateType ? (
						<Stack gap="lg" direction="column">
							<SelectControl
								__next40pxDefaultSize
								label={ __( 'Date filter' ) }
								value={ dateRange }
								options={ DATE_RANGE_OPTIONS }
								onChange={ ( value ) =>
									onChange( { dateRange: value } )
								}
							/>

							{ dateRange === 'custom' && (
								<Stack gap="md" direction="column">
									<TextControl
										__next40pxDefaultSize
										type="date"
										label={ __( 'Start date' ) }
										value={ metaDateStart }
										onChange={ ( value ) =>
											onChange( { metaDateStart: value } )
										}
									/>
									<TextControl
										__next40pxDefaultSize
										type="date"
										label={ __( 'End date' ) }
										value={ metaDateEnd }
										onChange={ ( value ) =>
											onChange( { metaDateEnd: value } )
										}
									/>
								</Stack>
							) }
						</Stack>
					) : (
						<Stack gap="lg" direction="column">
							<SelectControl
								__next40pxDefaultSize
								label={ __( 'Filter operator' ) }
								value={ metaCompare }
								options={ COMPARE_OPTIONS }
								onChange={ ( value ) =>
									onChange( { metaCompare: value } )
								}
							/>
							<TextControl
								__next40pxDefaultSize
								label={ __( 'Filter value' ) }
								help={ __(
									'Leave blank to only sort without filtering.'
								) }
								value={ metaValue }
								onChange={ ( value ) =>
									onChange( { metaValue: value } )
								}
							/>
						</Stack>
					) }
				</>
			) }
		</Stack>
	);
}
