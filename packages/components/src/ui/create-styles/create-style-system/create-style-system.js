/**
 * Internal dependencies
 */
import { createCompiler } from '../create-compiler';
import { createRootStore } from '../css-custom-properties';
import { createCoreElement } from './create-core-element';
import { createCoreElements } from './create-core-elements';
import { createStyledComponents } from './create-styled-components';
import { generateTheme } from './generate-theme';
import { createToken, DEFAULT_STYLE_SYSTEM_OPTIONS } from './utils';

const defaultOptions = DEFAULT_STYLE_SYSTEM_OPTIONS;

/* eslint-disable jsdoc/valid-types */
/**
 * @template {Record<string, string | number>} TConfig
 * @template {Record<string, string | number>} TDarkConfig
 * @template {Record<string, string | number>} THCConfig
 * @template {Record<string, string | number>} TDarkHCConfig
 * @template {string} TGeneratedTokens
 * @typedef CreateStyleSystemObjects
 * @property {import('./polymorphic-component').CoreElements} core A set of coreElements.
 * @property {import('../create-compiler').Compiler} compiler The Style system compiler (a custom Emotion instance).
 * @property {(tagName: keyof JSX.IntrinsicElements) => ReturnType<createCoreElement>} createCoreElement A function to create a coreElement (with settings from the Style system).
 * @property {import('../create-compiler').Compiler['css']} css A function to compile CSS styles.
 * @property {import('../create-compiler').Compiler['cx']} cx A function to resolve + combine classNames.
 * @property {(tokenName: string) => string} createToken A function to generate a design token (CSS variable) used by the system.
 * @property {(value: keyof (TConfig & TDarkConfig & THCConfig & TDarkHCConfig) | TGeneratedTokens) => string} get The primary function to retrieve Style system variables.
 * @property {import('./polymorphic-component').CreateStyled} styled A set of styled components.
 * @property {import('react').ComponentType} View The base <View /> component.
 * @property {import('../css-custom-properties').RootStore} rootStore The root store.
 */

/**
 * @template {Record<string, string | number>} TConfig
 * @template {Record<string, string | number>} TDarkConfig
 * @template {Record<string, string | number>} THCConfig
 * @template {Record<string, string | number>} TDarkHCConfig
 * @template {string} TGeneratedTokens
 * @typedef CreateStyleSystemOptions
 * @property {import('create-emotion').ObjectInterpolation<any>} baseStyles The base styles.
 * @property {TConfig} config The base theme config.
 * @property {TDarkConfig} darkModeConfig The dark mode theme config.
 * @property {THCConfig} highContrastModeConfig The high contrast mode theme config.
 * @property {TDarkHCConfig} darkHighContrastModeConfig The dark-high contrast mode theme config.
 * @property {import('../create-compiler').CreateCompilerOptions} [compilerOptions] The compiler options.
 */
/* eslint-enable jsdoc/valid-types */

/**
 * Creates a Style system using a set of baseStyles and configs.
 *
 * @example
 * ```js
 * const baseStyles = { background: 'blue' };
 * const blueStyleSystem = createStyleSystem({ baseStyles });
 * ```
 *
 * @template {Record<string, string | number>} TConfig
 * @template {Record<string, string | number>} TDarkConfig
 * @template {Record<string, string | number>} THCConfig
 * @template {Record<string, string | number>} TDarkHCConfig
 * @template {string} TGeneratedTokens
 * @param {CreateStyleSystemOptions<TConfig, TDarkConfig, THCConfig, TDarkHCConfig, TGeneratedTokens>} options Options to create a Style system with.
 * @return {CreateStyleSystemObjects<TConfig, TDarkConfig, THCConfig, TDarkHCConfig, TGeneratedTokens>} A collection of functions and elements from the generated Style system.
 */
export function createStyleSystem( options = defaultOptions ) {
	const {
		baseStyles,
		compilerOptions,
		config,
		darkHighContrastModeConfig,
		darkModeConfig,
		highContrastModeConfig,
	} = {
		...defaultOptions,
		...options,
	};

	const globalStyles = generateTheme( {
		config,
		darkHighContrastModeConfig,
		darkModeConfig,
		highContrastModeConfig,
	} );

	const rootStore = createRootStore( globalStyles.globalVariables );
	rootStore.setState( globalStyles.globalVariables );

	/**
	 * Compiler (Custom Emotion instance).
	 */
	const compiler = createCompiler( {
		...compilerOptions,
		rootStore,
	} );
	const { css, cx } = compiler;

	/**
	 * Core elements.
	 *
	 * @example
	 * ```jsx
	 * <core.div />
	 * ```
	 */
	const core = createCoreElements( { baseStyles, compiler, globalStyles } );

	/**
	 * Styled components.
	 *
	 * @example
	 * ```jsx
	 * const StyledDiv = styled.div``
	 *
	 * <StyledDiv />
	 * ```
	 */
	const styled = createStyledComponents( { compiler, core } );

	/**
	 * Export prebound createCoreElement factory.
	 *
	 * @param {keyof JSX.IntrinsicElements} tagName
	 */
	const _createCoreElement = ( tagName ) =>
		createCoreElement( tagName, { baseStyles, compiler, globalStyles } );

	const View = core.div;

	const styleSystem = {
		compiler,
		core,
		createCoreElement: _createCoreElement,
		createToken,
		css,
		cx,
		get: (
			/* eslint-disable jsdoc/no-undefined-types */
			/** @type {keyof TConfig | keyof TDarkConfig | keyof THCConfig | keyof TDarkHCConfig | TGeneratedTokens} */ key
			/* eslint-enable jsdoc/no-undefined-types */
		) => `var(${ createToken( key.toString() ) })`,
		styled,
		View,
		rootStore,
	};

	return styleSystem;
}

export default createStyleSystem;
