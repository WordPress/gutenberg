/**
 * External dependencies
 */
import { render, fireEvent } from '@testing-library/react-native';
import { v4 as uuid } from 'uuid';

/**
 * WordPress dependencies
 */
import { createElement, cloneElement } from '@wordpress/element';
// eslint-disable-next-line no-restricted-imports
import { initializeEditor as internalInitializeEditor } from '@wordpress/edit-post';

/**
 * Internal dependencies
 */
import { waitForStoreResolvers } from './wait-for-store-resolvers';

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
		const { screenWidth = 320, ...rest } = props || {};
		const editorElement = component
			? createElement( component, { postType, postId } )
			: internalInitializeEditor( uniqueId, postType, postId );

		const screen = render(
			cloneElement( editorElement, {
				initialTitle: 'test',
				...rest,
			} )
		);

		// A layout event must be explicitly dispatched in BlockList component,
		// otherwise the inner blocks are not rendered.
		fireEvent( screen.getByTestId( 'block-list-wrapper' ), 'layout', {
			nativeEvent: {
				layout: {
					width: screenWidth,
				},
			},
		} );

		return screen;
	} );
}
