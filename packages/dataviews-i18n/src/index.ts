/**
 * External dependencies
 */
import { __, _n, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { AnyMessage } from './types';

/**
 * The message catalog for `@wordpress/dataviews`.
 *
 * Every entry is a function so that its gettext call runs only when that
 * message is needed, rather than resolving the whole catalog when the module
 * loads. Going through a function also leaves room to resolve messages through
 * something other than the global `__` later.
 *
 * Entries are sorted alphabetically by key.
 */
const messages = {
	ACTIONS: () => __( 'Actions' ),

	ACTIVITY: () => __( 'Activity' ),

	ADD_FILTER: () => __( 'Add filter' ),

	APPEARANCE: () => __( 'Appearance' ),

	APPLY: () => __( 'Apply' ),

	BALANCED: () => _x( 'Balanced', 'Density option for DataView layout' ),

	CANCEL: () => __( 'Cancel' ),

	CLOSE: () => __( 'Close' ),

	COMFORTABLE: () =>
		_x( 'Comfortable', 'Density option for DataView layout' ),

	COMPACT: () => _x( 'Compact', 'Density option for DataView layout' ),

	CONDITIONS: () => __( 'Conditions' ),

	COULD_NOT_VALIDATE_ELEMENTS: () => __( 'Could not validate elements.' ),

	CURRENT_PAGE: () => __( 'Current page' ),

	CUSTOM: () => __( 'Custom' ),

	DATE: () => __( 'Date' ),

	DATE_TIME: () => __( 'Date time' ),

	DAYS: () => __( 'Days' ),

	DAYS_AGO: () => __( 'Days ago' ),

	DENSITY: () => __( 'Density' ),

	DESELECT_ALL: () => __( 'Deselect all' ),

	EDIT_FIELD: () =>
		/* translators: %s: Field name. */
		_x( 'Edit %s', 'field' ),

	EDIT_FIELD_WITH_ERRORS: () =>
		/* translators: %s: Field name. */
		_x( 'Edit %s (has errors)', 'field' ),

	ENABLE_INFINITE_SCROLL: () => __( 'Enable infinite scroll' ),

	ENABLE_INFINITE_SCROLL_HELP: () =>
		__(
			'Automatically load more content as you scroll, instead of showing pagination links.'
		),

	EVERY_VALUE_MUST_BE_A_STRING: () => __( 'Every value must be a string.' ),

	FALSE: () => __( 'False' ),

	FIELDS_NEED_ATTENTION: ( count: number ) =>
		/* translators: %d: Number of fields that need attention */
		_n( '%d field needs attention', '%d fields need attention', count ),

	FIELD_LABEL_AND_VALUE: () =>
		/* translators: 1: The label of the field e.g. "Date". 2: The value of the field, e.g.: "May 2022". */
		__( '%1$s: %2$s' ),

	FIELD_LABEL_WITH_GROUP_NAME_ELEMENT: () =>
		/* translators: %s: The label of the field e.g. "Status". */
		__( '%s: <groupName />' ),

	FILTER: () => _x( 'Filter', 'verb' ),

	FILTER_BY: () =>
		/* translators: 1: Filter name. */
		__( 'Filter by: %1$s' ),

	FILTER_SUMMARY_AFTER: () =>
		/* translators: 1: Filter name (e.g. "Date"). 2: Filter value (e.g. "2024-01-01"): "Date is after: 2024-01-01". */
		__( '<Name>%1$s is after: </Name><Value>%2$s</Value>' ),

	FILTER_SUMMARY_BEFORE: () =>
		/* translators: 1: Filter name (e.g. "Date"). 2: Filter value (e.g. "2024-01-01"): "Date is before: 2024-01-01". */
		__( '<Name>%1$s is before: </Name><Value>%2$s</Value>' ),

	FILTER_SUMMARY_BETWEEN_INC: () =>
		/* translators: 1: Filter name (e.g. "Item count"). 2: Filter value min. 3: Filter value max. e.g.: "Item count between (inc): 10 and 180". */
		__( '<Name>%1$s between (inc): </Name><Value>%2$s and %3$s</Value>' ),

	FILTER_SUMMARY_CONTAINS: () =>
		/* translators: 1: Filter name (e.g. "Title"). 2: Filter value (e.g. "Hello"): "Title contains: Hello". */
		__( '<Name>%1$s contains: </Name><Value>%2$s</Value>' ),

	FILTER_SUMMARY_DOESNT_CONTAIN: () =>
		/* translators: 1: Filter name (e.g. "Title"). 2: Filter value (e.g. "Hello"): "Title doesn't contain: Hello". */
		__( "<Name>%1$s doesn't contain: </Name><Value>%2$s</Value>" ),

	FILTER_SUMMARY_GREATER_THAN: () =>
		/* translators: 1: Filter name (e.g. "Count"). 2: Filter value (e.g. "10"): "Count is greater than: 10". */
		__( '<Name>%1$s is greater than: </Name><Value>%2$s</Value>' ),

	FILTER_SUMMARY_GREATER_THAN_OR_EQUAL: () =>
		/* translators: 1: Filter name (e.g. "Count"). 2: Filter value (e.g. "10"): "Count is greater than or equal to: 10". */
		__(
			'<Name>%1$s is greater than or equal to: </Name><Value>%2$s</Value>'
		),

	FILTER_SUMMARY_INCLUDES: () =>
		/* translators: 1: Filter name (e.g. "Author"). 2: Filter value (e.g. "Admin"): "Author includes: Admin, Editor". */
		__( '<Name>%1$s includes: </Name><Value>%2$s</Value>' ),

	FILTER_SUMMARY_INCLUDES_ALL: () =>
		/* translators: 1: Filter name (e.g. "Author"). 2: Filter value (e.g. "Admin"): "Author includes all: Admin, Editor". */
		__( '<Name>%1$s includes all: </Name><Value>%2$s</Value>' ),

	FILTER_SUMMARY_IN_THE_PAST: () =>
		/* translators: 1: Filter name (e.g. "Date"). 2: Filter value (e.g. "7 days"): "Date is in the past: 7 days". */
		__( '<Name>%1$s is in the past: </Name><Value>%2$s</Value>' ),

	FILTER_SUMMARY_IS: () =>
		/* translators: 1: Filter name (e.g. "Author"). 2: Filter value (e.g. "Admin"): "Author is: Admin". */
		__( '<Name>%1$s is: </Name><Value>%2$s</Value>' ),

	FILTER_SUMMARY_IS_NONE_OF: () =>
		/* translators: 1: Filter name (e.g. "Author"). 2: Filter value (e.g. "Admin"): "Author is none of: Admin, Editor". */
		__( '<Name>%1$s is none of: </Name><Value>%2$s</Value>' ),

	FILTER_SUMMARY_IS_NOT: () =>
		/* translators: 1: Filter name (e.g. "Author"). 2: Filter value (e.g. "Admin"): "Author is not: Admin". */
		__( '<Name>%1$s is not: </Name><Value>%2$s</Value>' ),

	FILTER_SUMMARY_LESS_THAN: () =>
		/* translators: 1: Filter name (e.g. "Count"). 2: Filter value (e.g. "10"): "Count is less than: 10". */
		__( '<Name>%1$s is less than: </Name><Value>%2$s</Value>' ),

	FILTER_SUMMARY_LESS_THAN_OR_EQUAL: () =>
		/* translators: 1: Filter name (e.g. "Count"). 2: Filter value (e.g. "10"): "Count is less than or equal to: 10". */
		__( '<Name>%1$s is less than or equal to: </Name><Value>%2$s</Value>' ),

	FILTER_SUMMARY_ON_OR_AFTER: () =>
		/* translators: 1: Filter name (e.g. "Date"). 2: Filter value (e.g. "2024-01-01"): "Date is on or after: 2024-01-01". */
		__( '<Name>%1$s is on or after: </Name><Value>%2$s</Value>' ),

	FILTER_SUMMARY_ON_OR_BEFORE: () =>
		/* translators: 1: Filter name (e.g. "Date"). 2: Filter value (e.g. "2024-01-01"): "Date is on or before: 2024-01-01". */
		__( '<Name>%1$s is on or before: </Name><Value>%2$s</Value>' ),

	FILTER_SUMMARY_OVER: () =>
		/* translators: 1: Filter name (e.g. "Date"). 2: Filter value (e.g. "7 days"): "Date is over: 7 days". */
		__( '<Name>%1$s is over: </Name><Value>%2$s</Value>' ),

	FILTER_SUMMARY_STARTS_WITH: () =>
		/* translators: 1: Filter name (e.g. "Title"). 2: Filter value (e.g. "Hello"): "Title starts with: Hello". */
		__( '<Name>%1$s starts with: </Name><Value>%2$s</Value>' ),

	FROM: () => __( 'From' ),

	GRID: () => __( 'Grid' ),

	HIDE_COLUMN: () => __( 'Hide column' ),

	HIDE_PASSWORD: () => __( 'Hide password' ),

	INSERT_LEFT: () => __( 'Insert left' ),

	INSERT_RIGHT: () => __( 'Insert right' ),

	ITEMS_OF_TOTAL: ( totalItems: number ) =>
		/* translators: %1$d: number of items. %2$d: total number of items. */
		_n( '%1$d of %2$d Item', '%1$d of %2$d Items', totalItems ),

	ITEMS_PER_PAGE: () => __( 'Items per page' ),

	ITEMS_SELECTED: ( count: number ) =>
		/* translators: %d: number of items. */
		_n( '%d Item selected', '%d Items selected', count ),

	ITEM_COUNT: ( count: number ) =>
		/* translators: %d: number of items. */
		_n( '%d Item', '%d Items', count ),

	LAST_30_DAYS: () => __( 'Last 30 days' ),

	LAST_7_DAYS: () => __( 'Last 7 days' ),

	LAST_YEAR: () => __( 'Last year' ),

	LAYOUT: () => __( 'Layout' ),

	LIST: () => __( 'List' ),

	LIST_OF: () =>
		/* translators: List of items for a filter. 1: Filter name. e.g.: "List of: Author". */
		__( 'List of: %1$s' ),

	MAX: () => __( 'Max.' ),

	MAX_MUST_BE_GREATER_THAN_MIN: () =>
		__( 'The max. value must be greater than the min. value.' ),

	MIN: () => __( 'Min.' ),

	MONTHS: () => __( 'Months' ),

	MONTHS_AGO: () => __( 'Months ago' ),

	MONTH_TO_DATE: () => __( 'Month to date' ),

	MORE_DETAILS: () => __( 'More details' ),

	MOVE_LEFT: () => __( 'Move left' ),

	MOVE_RIGHT: () => __( 'Move right' ),

	NAVIGATE_TO_ITEM: () => __( 'Navigate to item' ),

	NEXT_PAGE: () => __( 'Next page' ),

	NO_ELEMENTS_FOUND: () => __( 'No elements found' ),

	NO_RESULTS: () => __( 'No results' ),

	NO_RESULTS_FOUND: () => __( 'No results found' ),

	NO_TITLE: () => __( '(no title)' ),

	OPEN_COLOR_PICKER: () => __( 'Open color picker' ),

	OPERATOR_AFTER: () =>
		/* translators: DataViews operator name */
		__( 'After' ),

	OPERATOR_AFTER_INC: () =>
		/* translators: DataViews operator name */
		__( 'After (inc)' ),

	OPERATOR_BEFORE: () =>
		/* translators: DataViews operator name */
		__( 'Before' ),

	OPERATOR_BEFORE_INC: () =>
		/* translators: DataViews operator name */
		__( 'Before (inc)' ),

	OPERATOR_BETWEEN_INC: () =>
		/* translators: DataViews operator name */
		__( 'Between (inc)' ),

	OPERATOR_CONTAINS: () =>
		/* translators: DataViews operator name */
		__( 'Contains' ),

	OPERATOR_DOESNT_CONTAIN: () =>
		/* translators: DataViews operator name */
		__( "Doesn't contain" ),

	OPERATOR_GREATER_THAN: () =>
		/* translators: DataViews operator name */
		__( 'Greater than' ),

	OPERATOR_GREATER_THAN_OR_EQUAL: () =>
		/* translators: DataViews operator name */
		__( 'Greater than or equal' ),

	OPERATOR_INCLUDES: () =>
		/* translators: DataViews operator name */
		__( 'Includes' ),

	OPERATOR_INCLUDES_ALL: () =>
		/* translators: DataViews operator name */
		__( 'Includes all' ),

	OPERATOR_IN_THE_PAST: () =>
		/* translators: DataViews operator name */
		__( 'In the past' ),

	OPERATOR_IS: () =>
		/* translators: DataViews operator name */
		__( 'Is' ),

	OPERATOR_IS_NONE_OF: () =>
		/* translators: DataViews operator name */
		__( 'Is none of' ),

	OPERATOR_IS_NOT: () =>
		/* translators: DataViews operator name */
		__( 'Is not' ),

	OPERATOR_LESS_THAN: () =>
		/* translators: DataViews operator name */
		__( 'Less than' ),

	OPERATOR_LESS_THAN_OR_EQUAL: () =>
		/* translators: DataViews operator name */
		__( 'Less than or equal' ),

	OPERATOR_NOT_ON: () =>
		/* translators: DataViews operator name */
		__( 'Not on' ),

	OPERATOR_ON: () =>
		/* translators: DataViews operator name */
		__( 'On' ),

	OPERATOR_OVER: () =>
		/* translators: DataViews operator name */
		__( 'Over' ),

	OPERATOR_STARTS_WITH: () =>
		/* translators: DataViews operator name */
		__( 'Starts with' ),

	OPTIONAL: () => __( 'Optional' ),

	ORDER: () => __( 'Order' ),

	PAGE_X_OF_Y: () =>
		/* translators: 1: current page number. 2: total number of pages. */
		__( 'Page %1$d of %2$d' ),

	PAGE_X_OF_Y_WITH_INPUT: () =>
		/* translators: 1: Current page number, 2: Total number of pages. */
		_x( '<div>Page</div>%1$s<div>of %2$d</div>', 'paging' ),

	PAST_MONTH: () => __( 'Past month' ),

	PAST_WEEK: () => __( 'Past week' ),

	PREVIEW_SIZE: () => __( 'Preview size' ),

	PREVIOUS_PAGE: () => __( 'Previous page' ),

	PROPERTIES: () => __( 'Properties' ),

	REMOVE: () => __( 'Remove' ),

	REQUIRED: () => __( 'Required' ),

	RESET: () => __( 'Reset' ),

	RESET_VIEW: () => __( 'Reset view' ),

	ROW_NUMBER: () =>
		/* translators: %d: The row number in the grid */
		__( 'Row %d' ),

	SEARCH: () => __( 'Search' ),

	SEARCH_ITEMS: () => __( 'Search items' ),

	SELECT_ALL: () => __( 'Select all' ),

	SHOW_PASSWORD: () => __( 'Show password' ),

	SORT_ASCENDING: () => __( 'Sort ascending' ),

	SORT_BY: () => __( 'Sort by' ),

	SORT_DESCENDING: () => __( 'Sort descending' ),

	TABLE: () => __( 'Table' ),

	TO: () => __( 'To' ),

	TODAY: () => __( 'Today' ),

	TRUE: () => __( 'True' ),

	UNIT: () => __( 'Unit' ),

	UNKNOWN_ASYNC_CUSTOM_VALIDATION_ERROR: () =>
		__( 'Unknown error when running custom validation asynchronously.' ),

	UNKNOWN_ASYNC_ELEMENTS_VALIDATION_ERROR: () =>
		__( 'Unknown error when running elements validation asynchronously.' ),

	UNKNOWN_CUSTOM_VALIDATION_ERROR: () =>
		__( 'Unknown error when running custom validation.' ),

	UNKNOWN_STATUS_FOR_FILTER: () =>
		/* translators: 1: Filter name e.g.: "Unknown status for Author". */
		__( 'Unknown status for %1$s' ),

	VALIDATING: () => __( 'Validating…' ),

	VALIDATION_COULD_NOT_BE_PROCESSED: () =>
		__( 'Validation could not be processed.' ),

	VALUE_ABOVE_MAXIMUM: () => __( 'Value is above the maximum.' ),

	VALUE_BELOW_MINIMUM: () => __( 'Value is below the minimum.' ),

	VALUE_DOES_NOT_MATCH_PATTERN: () =>
		__( 'Value does not match the required pattern.' ),

	VALUE_MUST_BE_AN_ARRAY: () => __( 'Value must be an array.' ),

	VALUE_MUST_BE_AN_INTEGER: () => __( 'Value must be an integer.' ),

	VALUE_MUST_BE_A_NUMBER: () => __( 'Value must be a number.' ),

	VALUE_MUST_BE_A_VALID_COLOR: () => __( 'Value must be a valid color.' ),

	VALUE_MUST_BE_A_VALID_EMAIL_ADDRESS: () =>
		__( 'Value must be a valid email address.' ),

	VALUE_MUST_BE_BOOLEAN: () =>
		__( 'Value must be true, false, or undefined' ),

	VALUE_MUST_BE_ONE_OF_THE_ELEMENTS: () =>
		__( 'Value must be one of the elements.' ),

	VALUE_TOO_LONG: () => __( 'Value is too long.' ),

	VALUE_TOO_SHORT: () => __( 'Value is too short.' ),

	VIEW_OPTIONS: () => _x( 'View options', 'View is used as a noun' ),

	WEEKS: () => __( 'Weeks' ),

	WEEKS_AGO: () => __( 'Weeks ago' ),

	YEARS: () => __( 'Years' ),

	YEARS_AGO: () => __( 'Years ago' ),

	YEAR_TO_DATE: () => __( 'Year to date' ),

	YESTERDAY: () => __( 'Yesterday' ),
} satisfies Record< string, AnyMessage >;

export type { AnyMessage, Message } from './types';
export type DataViewsMessages = typeof messages;

export default messages;
