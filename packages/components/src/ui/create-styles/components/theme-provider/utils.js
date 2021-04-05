/**
 * WordPress dependencies
 */
import { isShallowEqualObjects } from '@wordpress/is-shallow-equal';
import { useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useIsomorphicLayoutEffect } from '../../../utils/use-isomorphic-layout-effect';

/**
 * Internal dependencies
 */
import { transformValuesToVariablesString } from '../../create-style-system/utils';
import { useReducedMotion } from '../../hooks';
import useThemeStylesStore, { setTheme } from './use-theme-styles-store';

/**
 * @typedef UseColorBlindModeProps
 * @property {boolean} isGlobal Determines if the theme styles are rendered globally or scoped locally.
 * @property {boolean} isColorBlind Determines if color-blind-mode styles should be rendered.
 * @property {import('react').RefObject<HTMLElement | undefined>} ref React ref.
 */

/**
 * Hook that sets the Style system's color-blind mode.
 *
 * @param {UseColorBlindModeProps} props Props for the hook.
 */
export function useColorBlindMode( { isColorBlind, isGlobal = true, ref } ) {
	useEffect( () => {
		if ( typeof isColorBlind === 'undefined' ) return;

		let target = document.documentElement;

		if ( ! isGlobal && ref.current ) {
			target = ref.current;
		}

		if ( isColorBlind ) {
			target.setAttribute( 'data-system-ui-color-blind-mode', 'true' );
		} else {
			target.setAttribute( 'data-system-ui-color-blind-mode', 'false' );
		}
	}, [ isGlobal, isColorBlind, ref ] );
}

/**
 * @typedef UseDarkModeProps
 * @property {boolean} isGlobal Determines if the theme styles are rendered globally or scoped locally.
 * @property {boolean} isDark Determines if dark-mode styles should be rendered.
 * @property {import('react').RefObject<HTMLElement | undefined>} ref React ref.
 */

/**
 * Hook that sets the Style system's dark mode.
 *
 * @param {UseDarkModeProps} props Props for the hook.
 */
export function useDarkMode( { isDark, isGlobal = true, ref } ) {
	useEffect( () => {
		if ( typeof isDark === 'undefined' ) return;

		let target = document.documentElement;

		if ( ! isGlobal && ref.current ) {
			target = ref.current;
		}

		if ( isDark ) {
			target.setAttribute( 'data-system-ui-mode', 'dark' );
		} else {
			target.setAttribute( 'data-system-ui-mode', 'light' );
		}
	}, [ isGlobal, isDark, ref ] );
}

/**
 * @typedef UseHighContrastMode
 * @property {boolean} isGlobal Determines if the theme styles are rendered globally or scoped locally.
 * @property {boolean} isHighContrast Determines if high-contrast styles should be rendered.
 * @property {import('react').RefObject<HTMLElement | undefined>} ref React ref.
 */

/**
 * Hook that sets the Style system's high-contrast mode.
 *
 * @param {UseHighContrastMode} props Props for the hook.
 */
export function useHighContrastMode( {
	isGlobal = true,
	isHighContrast,
	ref,
} ) {
	useEffect( () => {
		if ( typeof isHighContrast === 'undefined' ) return;

		let target = document.documentElement;

		if ( ! isGlobal && ref.current ) {
			target = ref.current;
		}

		if ( isHighContrast ) {
			target.setAttribute( 'data-system-ui-contrast-mode', 'high' );
		} else {
			target.setAttribute( 'data-system-ui-contrast-mode', 'normal' );
		}
	}, [ isGlobal, isHighContrast, ref ] );
}

/**
 * @typedef UseReducedMotionProps
 * @property {boolean} isGlobal Determines if the theme styles are rendered globally or scoped locally.
 * @property {boolean} isReducedMotion Determines if reduced-motion styles should be rendered.
 * @property {import('react').RefObject<HTMLElement | undefined>} ref React ref.
 */

/**
 * Hook that sets the Style system's reduced-motion mode.
 *
 * @param {UseReducedMotionProps} props Props for the hook.
 */
export function useReducedMotionMode( {
	isGlobal = true,
	isReducedMotion,
	ref,
} ) {
	const [ , setIsReducedMotion ] = useReducedMotion();

	useEffect( () => {
		if ( isGlobal ) {
			setIsReducedMotion( !! isReducedMotion );
		}
	}, [ isGlobal, isReducedMotion, setIsReducedMotion ] );

	useEffect( () => {
		if ( typeof isReducedMotion === 'undefined' ) return;

		let target = document.documentElement;

		if ( ! isGlobal && ref.current ) {
			target = ref.current;
		}

		if ( isReducedMotion ) {
			target.setAttribute( 'data-system-ui-reduced-motion-mode', 'true' );
		} else {
			target.setAttribute(
				'data-system-ui-reduced-motion-mode',
				'false'
			);
		}
	}, [ isGlobal, isReducedMotion, ref ] );
}

/* eslint-disable jsdoc/valid-types */
/**
 * @typedef UseThemeStyles
 * @property {import('create-emotion').Emotion['injectGlobal']} injectGlobal Inject global function.
 * @property {boolean} isGlobal Determines if the theme styles are rendered globally or scoped locally.
 * @property {Record<string, string>} theme Custom theme values.
 * @property {string} selector The selector to use.
 */
/* eslint-enable jsdoc/valid-types */

/**
 * Hook that sets the Style system's theme.
 *
 * @param {UseThemeStyles} props Props for the hook.
 * @return {string} The theme styles.
 */
export function useThemeStyles( {
	injectGlobal,
	isGlobal = true,
	theme = {},
	selector = ':root',
} ) {
	const [ { theme: themeStyles }, dispatch ] = useThemeStylesStore();

	/**
	 * Used to track/compare changes for theme prop changes.
	 */
	/** @type {import('react').MutableRefObject<Object | undefined>} */
	const themeRef = useRef();

	/**
	 * Work-around to inject a global theme style. This makes it compatible with
	 * SSR solutions, as injectGlobal is understood by Emotion's SSR flow.
	 */
	const didInjectGlobalStyles = useRef( false );

	if ( ! didInjectGlobalStyles.current && isGlobal && theme ) {
		if ( typeof injectGlobal === 'function' ) {
			try {
				const globalStyles = transformValuesToVariablesString(
					selector,
					theme,
					isGlobal
				);
				// Disable reason: `injectGlobal` is to be called as a template string function.
				// eslint-disable-next-line no-unused-expressions
				injectGlobal`${ globalStyles }`;
			} catch ( err ) {}
		}
		didInjectGlobalStyles.current = true;
	}

	useIsomorphicLayoutEffect( () => {
		/**
		 * We only want to update + set the theme if there's a change.
		 * Since themes (potentially) be nested, we need to do a shallowEqual check.
		 */
		if (
			themeRef.current &&
			theme &&
			isShallowEqualObjects( themeRef.current, theme )
		)
			return;

		themeRef.current = theme;

		/**
		 * This compiles the theme config (object) into CSS variables that
		 * the Style system understands and can be retrieved using the get() function.
		 */
		const styleNode = getStyleNode();
		const nextThemeHtml = transformValuesToVariablesString(
			selector,
			theme,
			isGlobal
		);

		if ( isGlobal ) {
			/**
			 * If isGlobal is preferred, we need to set the custom CSS variables onto
			 * the root element.
			 */
			if ( styleNode ) {
				styleNode.innerHTML = nextThemeHtml;
			}
		} else {
			/**
			 * Otherwise, we can set it to the themeStyles state, which will be
			 * rendered as custom properties on the ThemeProvider (HTMLDivElement).
			 */
			dispatch( setTheme( nextThemeHtml ) );
		}
	}, [ injectGlobal, isGlobal, dispatch, theme ] );

	return themeStyles;
}

function getStyleNode() {
	const id = 'StyleSystemThemeProviderStyleNode';
	let node = document.getElementById( id );

	if ( node ) return node;

	node = document.createElement( 'style' );
	node.id = id;
	node.setAttribute( 'data-g2-theme-provider', 'theme' );

	const headNode = document.querySelector( 'head' );
	if ( headNode ) {
		headNode.appendChild( node );
	}

	return node;
}
