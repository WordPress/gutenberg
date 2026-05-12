/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { calendar } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import type { WidgetTypeMetadata } from '../../routes/dashboard/widget-types';
import type { BackgroundEffect } from './components/on-this-day-view';
import type { TimeRange } from './hooks/use-on-this-day-post';

/**
 * Shape of the widget's persisted attributes. Bound to
 * `WidgetTypeMetadata` below so the attribute schema and the example
 * defaults are validated against this type.
 */
type OnThisDayWidgetType = {
	timeRange?: TimeRange;
	customDate?: string;
	effect?: BackgroundEffect;
};

const widget: WidgetTypeMetadata< OnThisDayWidgetType > = {
	apiVersion: 1,
	name: 'core/on-this-day',
	title: __( 'On This Day' ),
	description: __( 'A post published on this day in history.' ),
	icon: calendar,
	keywords: [
		__( 'memory' ),
		__( 'archive' ),
		__( 'anniversary' ),
		__( 'history' ),
	],
	attributes: [
		{
			id: 'timeRange',
			label: __( 'Time range' ),
			type: 'text',
			elements: [
				{ value: 'one-year-ago', label: __( 'One year ago' ) },
				{ value: 'five-years-ago', label: __( 'Five years ago' ) },
				{ value: 'ten-years-ago', label: __( 'Ten years ago' ) },
				{
					value: 'oldest-on-this-day',
					label: __( 'Oldest on this day (any year)' ),
				},
				{ value: 'custom', label: __( 'Custom date' ) },
			],
		},
		{
			id: 'customDate',
			label: __( 'Custom date (YYYY-MM-DD)' ),
			type: 'text',
		},
		{
			id: 'effect',
			label: __( 'Background effect' ),
			type: 'text',
			elements: [
				{ value: 'vintage', label: __( 'Vintage memory' ) },
				{ value: 'dim-saturate', label: __( 'Dim + saturate' ) },
				{ value: 'dim-blur', label: __( 'Dim + blur' ) },
				{ value: 'grayscale', label: __( 'Grayscale' ) },
				{ value: 'none', label: __( 'No filter' ) },
			],
		},
	],
	example: {
		attributes: {
			timeRange: 'oldest-on-this-day',
			effect: 'vintage',
		},
	},
};

export default widget;
