// eslint-disable-next-line import/no-extraneous-dependencies -- The owning test workspaces declare Vitest.
import 'vitest';

interface GutenbergVitestMatchers< R = unknown > {
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
	toMatchStyleDiffSnapshot: ( expected: Element | null ) => R;
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
	interface Assertion< T = any > extends GutenbergVitestMatchers< T > {}
	interface AsymmetricMatchersContaining extends GutenbergVitestMatchers {}
}
