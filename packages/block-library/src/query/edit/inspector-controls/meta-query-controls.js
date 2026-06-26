/**
 * WordPress dependencies
 */
import { TextControl, SelectControl } from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';

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
	postType,
	onChange,
} ) {
	const isDateType = metaType === 'DATE';

	/**
	 * Filters the list of available meta field "type" options shown in the
	 * Query Loop inspector. Lets plugins register additional types (e.g.
	 * `DATETIME`) for specialized CPTs. The corresponding server side
	 * resolution must be registered via the `query_loop_pre_build_meta_clause`
	 *  & `query_loop_meta_clause` PHP filters.
	 *
	 * @param {Array}  options  Default meta type options.
	 * @param {string} postType The post type currently configured on the block.
	 */
	const metaTypeOptions = applyFilters(
		'blockLibrary.query.metaTypeOptions',
		META_TYPE_OPTIONS,
		postType
	);

	/**
	 * Filters the list of date range presets shown in the Query Loop
	 * inspector. Lets plugins register custom presets (e.g. "This week",
	 * "Next 30 days") for event style CPTs. The corresponding server side
	 * resolution must be registered via the `query_loop_pre_build_meta_clause`
	 *  & `query_loop_meta_clause` PHP filters.
	 *
	 * @param {Array}  options  Default date range options.
	 * @param {string} postType The post type currently configured on the block.
	 */
	const dateRangeOptions = applyFilters(
		'blockLibrary.query.dateRangeOptions',
		DATE_RANGE_OPTIONS,
		postType
	);

	/**
	 * Filters the list of comparison operators shown for generic meta value
	 * filtering. The corresponding server side resolution must be registered
	 * via the `query_loop_allowed_meta_compare_operators`,
	 * `query_loop_pre_build_meta_clause` & `query_loop_meta_clause` PHP filters.
	 *
	 * @param {Array}  options  Default compare operators.
	 * @param {string} postType The post type currently configured on the block.
	 */
	const compareOptions = applyFilters(
		'blockLibrary.query.metaCompareOptions',
		COMPARE_OPTIONS,
		postType
	);

	/**
	 * Filters the controls rendered for the Meta field panel, after the
	 * built in controls. Lets plugins render entirely custom UI for specific
	 * post types.
	 *
	 * @param {Element|null} controls Defaults to `null`.
	 * @param {Object}       props    The full set of props passed to MetaQueryControls.
	 */
	const customControls = applyFilters(
		'blockLibrary.query.metaQueryControlsAfter',
		null,
		{
			metaKey,
			metaType,
			dateRange,
			metaDateStart,
			metaDateEnd,
			metaValue,
			metaCompare,
			postType,
			onChange,
		}
	);

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
						options={ metaTypeOptions }
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
								options={ dateRangeOptions }
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
								options={ compareOptions }
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
			{ customControls }
		</Stack>
	);
}
