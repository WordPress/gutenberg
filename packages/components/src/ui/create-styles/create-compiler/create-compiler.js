/**
 * External dependencies
 */
import createEmotion from 'create-emotion';
import mitt from 'mitt';

/**
 * Internal dependencies
 */
import { RootStore } from '../css-custom-properties';
import { createCSS } from './create-css';
import { createPlugins } from './plugins';
import { breakpoints, generateInterpolationName } from './utils';

const defaultOptions = {
	key: 'css',
	specificityLevel: 1,
	rootStore: new RootStore(),
};

/* eslint-disable jsdoc/valid-types */
/**
 * @typedef {import('create-emotion').Emotion & {
 *	breakpoints: typeof breakpoints,
 *	__events: import('mitt').Emitter,
 *  generateInterpolationName(): string,
 * }} Compiler
 */
/* eslint-enable jsdoc/valid-types */

/**
 * @typedef {import('create-emotion').Options & {
 *	key?: string,
 *	specificityLevel?: number,
 *	rootStore: import('../css-custom-properties').RootStore
 * }} CreateCompilerOptions
 */

/**
 * @param {CreateCompilerOptions} options
 * @return {Compiler} The compiler.
 */
export function createCompiler( options ) {
	const mergedOptions = {
		...defaultOptions,
		...options,
	};

	const { key, rootStore, specificityLevel } = mergedOptions;

	const defaultPlugins = createPlugins( {
		key,
		specificityLevel,
		rootStore,
	} );

	if ( options.stylisPlugins ) {
		if ( Array.isArray( options.stylisPlugins ) ) {
			mergedOptions.stylisPlugins = [
				...defaultPlugins,
				...options.stylisPlugins,
			];
		} else if ( typeof options.stylisPlugins !== 'undefined' ) {
			// just a single plugin was passed in, as is allowed by emotion
			mergedOptions.stylisPlugins = [
				...defaultPlugins,
				options.stylisPlugins,
			];
		} else {
			mergedOptions.stylisPlugins = defaultPlugins;
		}
	} else {
		mergedOptions.stylisPlugins = defaultPlugins;
	}

	/**
	 * We're creating a custom Emotion instance to ensure that the style system
	 * does not conflict with (potential) existing Emotion instances.
	 *
	 * We're also able to provide createEmotion with our custom Stylis plugins.
	 */
	const customEmotionInstance = {
		...createEmotion( mergedOptions ),
		/**
		 * Exposing the breakpoints used in the internal Style system.
		 */
		breakpoints,
		/**
		 * An internal custom event emitter (pub/sub) for Emotion.
		 * This is currently used in <StyleFrameProvider />
		 * to subscribe to and sync style injection.
		 */
		__events: mitt(),
		generateInterpolationName,
	};

	/**
	 * Enhance the base css function from Emotion to add features like responsive
	 * value handling and compiling an Array of css() calls.
	 */
	const { css } = customEmotionInstance;
	customEmotionInstance.css = createCSS( css );

	/**
	 * Modify the sheet.insert method to emit a `sheet.insert` event
	 * within the internal custom event emitter.
	 */
	const __insert = customEmotionInstance.sheet.insert;
	customEmotionInstance.sheet.insert = (
		/* eslint-disable jsdoc/valid-types */
		/** @type {[rule: string]} */ ...args
	) =>
		/* eslint-enable jsdoc/valid-types */
		{
			__insert.apply( customEmotionInstance.sheet, [ ...args ] );
			customEmotionInstance.__events.emit( 'sheet.insert', ...args );
		};

	return customEmotionInstance;
}
