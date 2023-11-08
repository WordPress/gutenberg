declare global {
	interface Window {
		// Silence the warning for `window.wp` in Playwright's evaluate functions.
		wp: any;
	}

	// Experimental API that is subject to change.
	// See https://developer.mozilla.org/en-US/docs/Web/API/LayoutShiftAttribution
	interface LayoutShiftAttribution {
		readonly node: Node;
		readonly previousRect: DOMRectReadOnly;
		readonly currentRect: DOMRectReadOnly;
		readonly toJSON: () => string;
	}

	// Experimental API that is subject to change.
	// See https://developer.mozilla.org/en-US/docs/Web/API/LayoutShift
	interface LayoutShift extends PerformanceEntry {
		readonly duration: number;
		readonly entryType: 'layout-shift';
		readonly name: 'layout-shift';
		readonly startTime: DOMHighResTimeStamp;
		readonly value: number;
		readonly hadRecentInput: boolean;
		readonly lastInputTime: DOMHighResTimeStamp;
		readonly sources: LayoutShiftAttribution[];
	}
}

export {};
