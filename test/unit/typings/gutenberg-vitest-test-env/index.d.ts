import 'vitest';

interface GutenbergVitestMatchers {
	toBePositionedPopover: () => void;
	toHaveErrored: () => void;
	toHaveErroredWith: ( ...args: unknown[] ) => void;
	toHaveInformed: () => void;
	toHaveInformedWith: ( ...args: unknown[] ) => void;
	toHaveLogged: () => void;
	toHaveLoggedWith: ( ...args: unknown[] ) => void;
	toHaveWarned: () => void;
	toHaveWarnedWith: ( ...args: unknown[] ) => void;
	toMatchDiffSnapshot: ( expected: unknown ) => void;
	toMatchStyleDiffSnapshot: ( expected: Element | null ) => void;
}

interface GutenbergVitestEnvironment {
	mockCSSSupports: () => void;
	mockMatchMedia: () => void;
	mockPointerEvent: () => void;
	mockResizeObserver: () => void;
	mockScrollIntoView: () => void;
	mockVisibleElements: () => void;
	timers: typeof import('vitest').vi;
}

declare global {
	var wpVitest: GutenbergVitestEnvironment;
}

declare module 'vitest' {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	interface Matchers< T = any > extends GutenbergVitestMatchers {}
}
