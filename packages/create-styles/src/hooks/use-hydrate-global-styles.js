const __INTERNAL_STATE__ = {
	didInjectGlobal: false,
};

/* eslint-disable jsdoc/valid-types */
/**
 * @typedef UseHydrateGlobalStylesProps
 * @property {import('create-emotion').Emotion['injectGlobal']} injectGlobal injectGlobal function from the compiler (Emotion).
 * @property {import('../create-style-system/generate-theme').GenerateThemeResults} globalStyles Global style values to be injected.
 */
/* eslint-enable jsdoc/valid-types */

/**
 * Renders configs (global styles) from the Style system into the DOM on
 * initial render.
 *
 * This is a very important custom hook for the Style system.
 * This hook injects the global styles (theme configs, dark mode configs, etc...)
 * from the Style system into the DOM. It does so seamlessly (once) on initial
 * render, enabling the styled coreElements, components, and CSS compiler
 * to work without the need for Context Providers/Consumers.
 *
 * @param {UseHydrateGlobalStylesProps} props Props for the hook.
 */
export function useHydrateGlobalStyles( { globalStyles, injectGlobal } ) {
	if ( __INTERNAL_STATE__.didInjectGlobal ) return;

	const {
		darkHighContrastModeCSSVariables,
		darkModeCSSVariables,
		globalCSSVariables,
		highContrastModeCSSVariables,
	} = globalStyles;

	/**
	 * Using the compiler's (Emotion) injectGlobal function.
	 */
	if ( injectGlobal ) {
		// eslint-disable-next-line no-unused-expressions
		injectGlobal`
			${ globalCSSVariables };
			${ darkModeCSSVariables };
			${ highContrastModeCSSVariables };
			${ darkHighContrastModeCSSVariables };
		`;

		/**
		 * Ensure that this only happens once with a singleton state.
		 */
		__INTERNAL_STATE__.didInjectGlobal = true;
	}
}
