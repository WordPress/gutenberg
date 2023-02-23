/**
 * External dependencies
 */
import { existsSync, readFileSync, unlinkSync } from 'fs';

export function readFile( filePath ) {
	return existsSync( filePath )
		? readFileSync( filePath, 'utf8' ).trim()
		: '';
}

export function deleteFile( filePath ) {
	if ( existsSync( filePath ) ) {
		unlinkSync( filePath );
	}
}

function isEvent( item, type ) {
	return (
		item.cat === 'devtools.timeline' &&
		item.name === 'EventDispatch' &&
		item.dur &&
		item.args &&
		item.args.data &&
		item.args.data.type === type
	);
}

function isKeyDownEvent( item ) {
	return isEvent( item, 'keydown' );
}

function isClickEvent( item ) {
	return isEvent( item, 'click' );
}

function isMouseOverEvent( item ) {
	return isEvent( item, 'mouseover' );
}

function isMouseOutEvent( item ) {
	return isEvent( item, 'mouseout' );
}

function getEventDurationsForType( trace, filterFunction ) {
	return trace.traceEvents
		.filter( filterFunction )
		.map( ( item ) => item.dur / 1000 );
}

function getEventStartForType( trace, filterFunction ) {
	return trace.traceEvents
		.filter( filterFunction )
		.map( ( item ) => item.ts / 1000 );
}

export function getTypingEventDurations( trace ) {
	return [ getEventStartForType( trace, isKeyDownEvent ) ];
}

export function getDiffBetweenEventStarts( trace, aType, bType ) {
	const aEvent = trace.traceEvents.find( ( item ) => isEvent( item, aType ) );
	const bEvent = trace.traceEvents.find( ( item ) => isEvent( item, bType ) );
	return ( bEvent.ts - aEvent.ts ) / 1000;
}

export function getClickEventDurations( trace ) {
	return [ getEventDurationsForType( trace, isClickEvent ) ];
}

export function getHoverEventDurations( trace ) {
	return [
		getEventDurationsForType( trace, isMouseOverEvent ),
		getEventDurationsForType( trace, isMouseOutEvent ),
	];
}

export async function getLoadingDurations() {
	return await page.evaluate( () => {
		const [
			{
				requestStart,
				responseStart,
				responseEnd,
				domContentLoadedEventEnd,
				loadEventEnd,
			},
		] = performance.getEntriesByType( 'navigation' );
		const paintTimings = performance.getEntriesByType( 'paint' );
		return {
			// Server side metric.
			serverResponse: responseStart - requestStart,
			// For client side metrics, consider the end of the response (the
			// browser receives the HTML) as the start time (0).
			firstPaint:
				paintTimings.find( ( { name } ) => name === 'first-paint' )
					.startTime - responseEnd,
			domContentLoaded: domContentLoadedEventEnd - responseEnd,
			loaded: loadEventEnd - responseEnd,
			firstContentfulPaint:
				paintTimings.find(
					( { name } ) => name === 'first-contentful-paint'
				).startTime - responseEnd,
			// This is evaluated right after Puppeteer found the block selector.
			firstBlock: performance.now() - responseEnd,
		};
	} );
}

export function sum( arr ) {
	return arr.reduce( ( a, b ) => a + b, 0 );
}
