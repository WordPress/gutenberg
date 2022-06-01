/**
 * External dependencies
 */
import { act, render, fireEvent } from '@testing-library/react-native';
import { v4 as uuid } from 'uuid';

/**
 * WordPress dependencies
 */
import {
	subscribeParentGetHtml,
	provideToNative_Html as provideToNativeHtml,
} from '@wordpress/react-native-bridge';
import { initializeEditor as internalInitializeEditor } from '@wordpress/edit-post';
import { createElement, cloneElement } from '@wordpress/element';

// Set up the mocks for getting the HTML output of the editor.
let triggerHtmlSerialization;
let serializedHtml;
subscribeParentGetHtml.mockImplementation( ( callback ) => {
	if ( ! triggerHtmlSerialization ) {
		triggerHtmlSerialization = callback;
		return {
			remove: () => {
				triggerHtmlSerialization = undefined;
			},
		};
	}
} );
provideToNativeHtml.mockImplementation( ( html ) => {
	serializedHtml = html;
} );

const frameTime = 1000 / 60;

/**
 * Set up fake timers for executing a function and restores them afterwards.
 *
 * @param {Function} fn Function to trigger.
 *
 * @return {*} The result of the function call.
 */
export async function withFakeTimers( fn ) {
	const usingFakeTimers = jest.isMockFunction( setTimeout );

	// Portions of the React Native Animation API rely upon these APIs. However,
	// Jest's 'legacy' fake timers mutate these globals, which breaks the Animated
	// API. We preserve the original implementations to restore them later.
	const requestAnimationFrameCopy = global.requestAnimationFrame;
	const cancelAnimationFrameCopy = global.cancelAnimationFrame;

	if ( ! usingFakeTimers ) {
		jest.useFakeTimers( 'legacy' );
	}

	const result = await fn();

	if ( ! usingFakeTimers ) {
		jest.useRealTimers();

		global.requestAnimationFrame = requestAnimationFrameCopy;
		global.cancelAnimationFrame = cancelAnimationFrameCopy;
	}
	return result;
}

/**
 * Prepare timers for executing a function that uses the Reanimated APIs.
 *
 * NOTE: This code is based on a similar function provided by the Reanimated library.
 * Reference: https://github.com/software-mansion/react-native-reanimated/blob/b4ee4ea9a1f246c461dd1819c6f3d48440a25756/src/reanimated2/jestUtils.ts#L170-L174
 *
 * @param {Function} fn Function to trigger.
 *
 * @return {*} The result of the function call.
 */
export async function withReanimatedTimer( fn ) {
	return withFakeTimers( async () => {
		global.requestAnimationFrame = ( callback ) =>
			setTimeout( callback, frameTime );

		const result = await fn();

		// As part of the clean up, we run all pending timers that might have been derived from animations.
		act( () => jest.runOnlyPendingTimers() );

		return result;
	} );
}

/**
 * Advance Reanimated animations by time.
 * This helper should be called within a function invoked by "withReanimatedTimer".
 *
 * NOTE: This code is based on a similar function provided by the Reanimated library.
 * Reference: https://github.com/software-mansion/react-native-reanimated/blob/b4ee4ea9a1f246c461dd1819c6f3d48440a25756/src/reanimated2/jestUtils.ts#L176-L181
 *
 * @param {number} time Time to advance timers.
 */
export const advanceAnimationByTime = ( time = frameTime ) => {
	for ( let i = 0; i <= Math.ceil( time / frameTime ); i++ ) {
		jest.advanceTimersByTime( frameTime );
	}
	jest.advanceTimersByTime( frameTime );
};

/**
 * Advance Reanimated animations by frames.
 * This helper should be called within a function invoked by "withReanimatedTimer".
 *
 * NOTE: This code is based on a similar function provided by the Reanimated library.
 * Reference: https://github.com/software-mansion/react-native-reanimated/blob/b4ee4ea9a1f246c461dd1819c6f3d48440a25756/src/reanimated2/jestUtils.ts#L183-L188
 *
 * @param {number} count Number of frames to advance timers.
 */
export const advanceAnimationByFrame = ( count ) => {
	for ( let i = 0; i <= count; i++ ) {
		jest.advanceTimersByTime( frameTime );
	}
	jest.advanceTimersByTime( frameTime );
};

/**
 * Executes a function that triggers store resolvers and waits for them to be finished.
 *
 * Asynchronous store resolvers leverage `setTimeout` to run at the end of
 * the current JavaScript block execution. In order to prevent "act" warnings
 * triggered by updates to the React tree, we manually tick fake timers and
 * await the resolution of the current block execution before proceeding.
 *
 * @param {Function} fn Function that to trigger.
 *
 * @return {*} The result of the function call.
 */
export async function waitForStoreResolvers( fn ) {
	return withFakeTimers( async () => {
		const result = fn();

		// Advance all timers allowing store resolvers to resolve.
		act( () => jest.runAllTimers() );

		// The store resolvers perform several API fetches during editor
		// initialization. The most straightforward approach to ensure all of them
		// resolve before we consider the editor initialized is to flush micro tasks,
		// similar to the approach found in `@testing-library/react-native`.
		// https://github.com/callstack/react-native-testing-library/blob/a010ffdbca906615279ecc3abee423525e528101/src/flushMicroTasks.js#L15-L23.
		await act( async () => {} );

		return result;
	} );
}

/**
 * Initialize an editor for test assertions.
 *
 * @param {Object}                    props               Properties passed to the editor component.
 * @param {string}                    props.initialHtml   String of block editor HTML to parse and render.
 * @param {Object}                    [options]           Configuration options for the editor.
 * @param {import('react').ReactNode} [options.component] A specific editor component to render.
 * @return {import('@testing-library/react-native').RenderAPI} A Testing Library screen.
 */
export async function initializeEditor( props, { component } = {} ) {
	const uniqueId = uuid();
	const postId = `post-id-${ uniqueId }`;
	const postType = 'post';

	return waitForStoreResolvers( () => {
		const editorElement = component
			? createElement( component, { postType, postId } )
			: internalInitializeEditor( uniqueId, postType, postId );

		const screen = render(
			cloneElement( editorElement, {
				initialTitle: 'test',
				...props,
			} )
		);

		// A layout event must be explicitly dispatched in BlockList component,
		// otherwise the inner blocks are not rendered.
		fireEvent( screen.getByTestId( 'block-list-wrapper' ), 'layout', {
			nativeEvent: {
				layout: {
					width: 100,
				},
			},
		} );

		return screen;
	} );
}

export * from '@testing-library/react-native';

// Custom implementation of the waitFor utility to prevent the issue: https://github.com/callstack/react-native-testing-library/issues/379.
export function waitFor(
	cb,
	{ timeout, interval } = { timeout: 1000, interval: 50 }
) {
	let result;
	let lastError;
	const check = ( resolve, reject, time = 0 ) => {
		try {
			result = cb();
		} catch ( error ) {
			lastError = error;
		}
		if ( ! result && time < timeout ) {
			setTimeout(
				() => check( resolve, reject, time + interval ),
				interval
			);
			return;
		}
		resolve( result );
	};
	return new Promise( ( resolve, reject ) =>
		act(
			() => new Promise( ( internalResolve ) => check( internalResolve ) )
		).then( () => {
			if ( ! result ) {
				reject(
					`waitFor timed out after ${ timeout }ms for callback:\n${ cb }\n${ lastError.toString() }`
				);
				return;
			}
			resolve( result );
		} )
	);
}

// Helper for getting the current HTML output of the editor.
export function getEditorHtml() {
	if ( ! triggerHtmlSerialization ) {
		throw new Error( 'HTML serialization trigger is not defined.' );
	}
	triggerHtmlSerialization();
	return serializedHtml;
}
