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
// Editor component is not exposed in the pacakge because is meant to be consumed
// internally, however we require it for rendering the editor in integration tests,
// for this reason it's imported with path access.
// eslint-disable-next-line no-restricted-syntax
import Editor from '@wordpress/edit-post/src/editor';

// Set up the mocks for getting the HTML output of the editor
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

/**
 * Executes a function that triggers store resolvers.
 *
 * Asynchronous store resolvers rely upon `setTimeout` to run at the end of the
 * current JavaScript block execution In order to prevent "act" warnings triggered
 * by updates to the React tree, we leverage fake timers to manually tick and
 * await the resolution of the current block execution before proceeding.
 *
 * @param {Function} fn Function that triggers store resolvers.
 * @return {*} The result of the function call.
 */
export function executeStoreResolvers( fn ) {
	// Portions of the React Native Animation API rely upon these APIs. However,
	// Jest's 'legacy' fake timers mutate these globals, which breaks the Animated
	// API. We preserve the original implementations to restore them later.
	const originalRAF = global.requestAnimationFrame;
	const originalCAF = global.cancelAnimationFrame;

	// Asynchronous store resolvers leverage `setTimeout` to run at the end of
	// the current JavaScript block execution. In order to prevent "act" warnings
	// triggered by updates to the React tree, we manually tick fake timers and
	// await the resolution of the current block execution before proceeding.
	jest.useFakeTimers( 'legacy' );

	const result = fn();

	// Advance all timers allowing store resolvers to resolve.
	act( () => jest.runAllTimers() );

	// Restore the default timer APIs for remainder of test arrangement, act, and
	// assertion.
	jest.useRealTimers();

	// Restore the global animation frame APIs to their original state for the
	// React Native Animated API.
	global.requestAnimationFrame = originalRAF;
	global.cancelAnimationFrame = originalCAF;

	return result;
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
export async function initializeEditor( props, { component = Editor } = {} ) {
	let screen;
	executeStoreResolvers( () => {
		const EditorComponent = component;
		screen = render(
			<EditorComponent
				postId={ `post-id-${ uuid() }` }
				postType="post"
				initialTitle="test"
				{ ...props }
			/>
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
	} );

	// The store resolvers perform several API fetches during editor
	// initialization. The most straightforward approach to ensure all of them
	// resolve before we consider the editor initialized is to flush micro tasks,
	// similar to the approach found in `@testing-library/react-native`.
	// https://github.com/callstack/react-native-testing-library/blob/a010ffdbca906615279ecc3abee423525e528101/src/flushMicroTasks.js#L15-L23
	await act( async () => {} );

	return screen;
}

export * from '@testing-library/react-native';

// Custom implementation of the waitFor utility to prevent the issue: https://git.io/JYYGE
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

// Helper for getting the current HTML output of the editor
export function getEditorHtml() {
	if ( ! triggerHtmlSerialization ) {
		throw new Error( 'HTML serialization trigger is not defined.' );
	}
	triggerHtmlSerialization();
	return serializedHtml;
}
