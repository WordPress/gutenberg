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

export function initializeEditor( props, customEditorComponent ) {
	// Portions of the React Native Animation API rely upon these APIs. However,
	// Jest's 'legacy' fake timer mutate these globals, which breaks the Animated
	// API. We preserve the original implementations to restore them later.
	const originalRAF = global.requestAnimationFrame;
	const originalCAF = global.cancelAnimationFrame;

	// During editor initialization, asynchronous store resolvers rely upon
	// `setTimeout` to run at the end of the current JavaScript block execution.
	// In order to prevent "act" warnings triggered by updates to the React tree,
	// we leverage fake timers to manually tick and await the resolution of the
	// current block execution before proceeding.
	jest.useFakeTimers( 'legacy' );

	// Arrange
	const EditorComponent = customEditorComponent || Editor;
	const screen = render(
		<EditorComponent
			postId={ `post-id-${ uuid() }` }
			postType="post"
			initialTitle="test"
			{ ...props }
		/>
	);

	// Layout event must be explicitly dispatched in BlockList component,
	// otherwise the inner blocks are not rendered.
	fireEvent( screen.getByTestId( 'block-list-wrapper' ), 'layout', {
		nativeEvent: {
			layout: {
				width: 100,
			},
		},
	} );

	// Advance all timers allowing store resolvers to resolve.
	act( () => jest.runAllTimers() );

	// Restore the default timer APIs for remainder of test arrangement, act, and
	// assertion.
	jest.useRealTimers();

	// Restore the global animation frame APIs to their original state for the
	// React Native Animated API.
	global.requestAnimationFrame = originalRAF;
	global.cancelAnimationFrame = originalCAF;

	return screen;
}

export * from '@testing-library/react-native';

// Custom implementation of the waitFor utility to prevent the issue: https://git.io/JYYGE
export function waitFor(
	cb,
	{ timeout, interval } = { timeout: 1000, interval: 50 }
) {
	let result;
	const check = ( resolve, reject, time = 0 ) => {
		try {
			result = cb();
		} catch ( e ) {
			//NOOP
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
					`waitFor timed out after ${ timeout }ms for callback:\n${ cb }`
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
