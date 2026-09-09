import 'vitest';
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

interface GutenbergVitestMatchers< R > {
	toBePositionedPopover: () => R;
	toHaveErrored: () => R;
	toHaveErroredWith: ( ...args: unknown[] ) => R;
	toHaveInformed: () => R;
	toHaveInformedWith: ( ...args: unknown[] ) => R;
	toHaveLogged: () => R;
	toHaveLoggedWith: ( ...args: unknown[] ) => R;
	toHaveWarned: () => R;
	toHaveWarnedWith: ( ...args: unknown[] ) => R;
	toMatchDiffSnapshot: ( expected: unknown ) => R;
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
	interface Matchers<
		R extends void | Promise< void > = void | Promise< void >,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Keep Vitest's canonical generic matcher interface.
		T = unknown,
	> extends GutenbergVitestMatchers< R >,
			TestingLibraryMatchers< any, R > {}
}
