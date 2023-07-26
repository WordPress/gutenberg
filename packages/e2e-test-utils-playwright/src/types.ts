declare global {
	interface Window {
		// Silence the warning for `window.wp` in Playwright's evaluate functions.
		wp: any;
	}

	interface LayoutShiftAttribution {
		readonly node: Node;
		readonly previousRect: DOMRectReadOnly;
		readonly currentRect: DOMRectReadOnly;
		readonly toJSON: () => string;
	}
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
