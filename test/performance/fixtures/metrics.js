export class Metrics {
	constructor( { page } ) {
		this.page = page;
	}

	async getTimeToFirstByte() {
		return await this.page.evaluate( () => {
			// Based on https://web.dev/ttfb/#measure-ttfb-in-javascript
			return new Promise( ( resolve ) => {
				new PerformanceObserver( ( entryList ) => {
					const [ pageNav ] =
						entryList.getEntriesByType( 'navigation' );
					resolve( pageNav.responseStart );
				} ).observe( {
					type: 'navigation',
					buffered: true,
				} );
			} );
		} );
	}

	async getLargestContentfulPaint() {
		return await this.page.evaluate( () => {
			// Based on https://www.checklyhq.com/learn/headless/basics-performance#largest-contentful-paint-api-largest-contentful-paint
			return new Promise( ( resolve ) => {
				new PerformanceObserver( ( entryList ) => {
					const entries = entryList.getEntries();
					// The last entry is the largest contentful paint.
					const largestPaintEntry = entries.at( -1 );

					resolve( largestPaintEntry.startTime );
				} ).observe( {
					type: 'largest-contentful-paint',
					buffered: true,
				} );
			} );
		} );
	}

	async getLoadingDurations() {
		return await this.page.evaluate( () => {
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

	getTypingEventDurations( trace ) {
		return [
			getEventDurationsForType( trace, isKeyDownEvent ),
			getEventDurationsForType( trace, isKeyPressEvent ),
			getEventDurationsForType( trace, isKeyUpEvent ),
		];
	}

	getSelectionEventDurations( trace ) {
		return [
			getEventDurationsForType( trace, isFocusEvent ),
			getEventDurationsForType( trace, isFocusInEvent ),
		];
	}

	getClickEventDurations( trace ) {
		return [ getEventDurationsForType( trace, isClickEvent ) ];
	}

	getHoverEventDurations( trace ) {
		return [
			getEventDurationsForType( trace, isMouseOverEvent ),
			getEventDurationsForType( trace, isMouseOutEvent ),
		];
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
