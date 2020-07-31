/**
 * WordPress dependencies
 */
import { parse, serialize } from '@wordpress/blocks';
/**
 * Internal dependencies
 */
import { resolveWidgetAreas, select, dispatch } from './controls';

export function* saveEditedWidgetAreas() {
	const widgetAreas = yield select(
		'core/edit-widgets',
		'getEditedWidgetAreas'
	);
	if ( ! widgetAreas ) {
		return;
	}

	// @TODO: Batch save
	for ( const widgetArea in widgetAreas ) {
		// @TODO: Concurrency?
		yield* saveWidgetArea( widgetArea );
	}
}

export function* saveWidgetArea( widgetArea ) {
	console.log( 'saving widget area', widgetArea );
	// return;
	// const blocks = parse( widgetArea.content );
	// const widgets = blocks.map( convertBlockToWidget );
	// Update the entity with widgets list
	// Save the entity by sending an API request
}

// function convertBlockToWidget( block ) {}
