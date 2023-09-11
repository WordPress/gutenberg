/**
 * External dependencies
 */
import { existsSync, readFileSync, unlinkSync } from 'fs';

export function sum( array ) {
	if ( ! array || ! array.length ) return undefined;

	return array.reduce( ( a, b ) => a + b, 0 );
}

export function average( array ) {
	if ( ! array || ! array.length ) return undefined;

	return sum( array ) / array.length;
}

export function median( array ) {
	if ( ! array || ! array.length ) return undefined;

	const numbers = [ ...array ].sort( ( a, b ) => a - b );
	const middleIndex = Math.floor( numbers.length / 2 );

	if ( numbers.length % 2 === 0 ) {
		return ( numbers[ middleIndex - 1 ] + numbers[ middleIndex ] ) / 2;
	}
	return numbers[ middleIndex ];
}

export function minimum( array ) {
	if ( ! array || ! array.length ) return undefined;

	return Math.min( ...array );
}

export function maximum( array ) {
	if ( ! array || ! array.length ) return undefined;

	return Math.max( ...array );
}

export function round( number, decimalPlaces = 2 ) {
	const factor = Math.pow( 10, decimalPlaces );

	return Math.round( number * factor ) / factor;
}

export function readFile( filePath ) {
	if ( ! existsSync( filePath ) ) {
		throw new Error( `File does not exist: ${ filePath }` );
	}

	return readFileSync( filePath, 'utf8' ).trim();
}

export function deleteFile( filePath ) {
	if ( existsSync( filePath ) ) {
		unlinkSync( filePath );
	}
}

function isEvent( item ) {
	return (
		item.cat === 'devtools.timeline' &&
		item.name === 'EventDispatch' &&
		item.dur &&
		item.args &&
		item.args.data
	);
}

function isKeyDownEvent( item ) {
	return isEvent( item ) && item.args.data.type === 'keydown';
}

function isKeyPressEvent( item ) {
	return isEvent( item ) && item.args.data.type === 'keypress';
}

function isKeyUpEvent( item ) {
	return isEvent( item ) && item.args.data.type === 'keyup';
}

function isFocusEvent( item ) {
	return isEvent( item ) && item.args.data.type === 'focus';
}

function isFocusInEvent( item ) {
	return isEvent( item ) && item.args.data.type === 'focusin';
}

function isClickEvent( item ) {
	return isEvent( item ) && item.args.data.type === 'click';
}

function isMouseOverEvent( item ) {
	return isEvent( item ) && item.args.data.type === 'mouseover';
}

function isMouseOutEvent( item ) {
	return isEvent( item ) && item.args.data.type === 'mouseout';
}

function getEventDurationsForType( trace, filterFunction ) {
	return trace.traceEvents
		.filter( filterFunction )
		.map( ( item ) => item.dur / 1000 );
}

export function getTypingEventDurations( trace ) {
	return [
		getEventDurationsForType( trace, isKeyDownEvent ),
		getEventDurationsForType( trace, isKeyPressEvent ),
		getEventDurationsForType( trace, isKeyUpEvent ),
	];
}

export function getSelectionEventDurations( trace ) {
	return [
		getEventDurationsForType( trace, isFocusEvent ),
		getEventDurationsForType( trace, isFocusInEvent ),
	];
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

export async function getLoadingDurations( page ) {
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
			// This is evaluated right after Playwright found the block selector.
			firstBlock: performance.now() - responseEnd,
		};
	} );
}

export async function loadBlocksFromHtml( page, filepath ) {
	if ( ! existsSync( filepath ) ) {
		throw new Error( `File not found (${ filepath })` );
	}

	return await page.evaluate( ( html ) => {
		const { parse } = window.wp.blocks;
		const { dispatch } = window.wp.data;
		const blocks = parse( html );

		blocks.forEach( ( block ) => {
			if ( block.name === 'core/image' ) {
				delete block.attributes.id;
				delete block.attributes.url;
			}
		} );

		dispatch( 'core/block-editor' ).resetBlocks( blocks );
	}, readFile( filepath ) );
}

export async function load1000Paragraphs( page ) {
	await page.evaluate( () => {
		const { createBlock } = window.wp.blocks;
		const { dispatch } = window.wp.data;
		const blocks = Array.from( { length: 1000 } ).map( () =>
			createBlock( 'core/paragraph' )
		);
		dispatch( 'core/block-editor' ).resetBlocks( blocks );
	} );
}
