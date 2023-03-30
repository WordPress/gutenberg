/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';

addFilter(
	'blocks.registerBlockType',
	'core/widgets/widget-id',
	( settings ) => ( {
		...settings,
		attributes: {
			...settings.attributes,
			_widgetId: {
				type: 'string',
				internal: true,
			},
		},
	} )
);
