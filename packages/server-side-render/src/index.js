/**
 * WordPress dependencies
 */
import { forwardRef, useMemo } from '@wordpress/element';
import { useSelect, withSelect } from '@wordpress/data';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import {
	default as ServerSideRender,
	useServerSideRender,
} from './server-side-render';

/**
 * Constants
 */
const EMPTY_OBJECT = {};

const ExportedServerSideRender = withSelect( ( select ) => {
	// FIXME: @wordpress/server-side-render should not depend on @wordpress/editor.
	// It is used by blocks that can be loaded into a *non-post* block editor.
	// eslint-disable-next-line @wordpress/data-no-store-string-literals
	const coreEditorSelect = select( 'core/editor' );
	if ( coreEditorSelect ) {
		const currentPostId = coreEditorSelect.getCurrentPostId();
		// For templates and template parts we use a custom ID format.
		// Since they aren't real posts, we don't want to use their ID
		// for server-side rendering. Since they use a string based ID,
		// we can assume real post IDs are numbers.
		if ( currentPostId && typeof currentPostId === 'number' ) {
			return {
				currentPostId,
			};
		}
	}
	return EMPTY_OBJECT;
} )( ( { urlQueryArgs = EMPTY_OBJECT, currentPostId, ...props } ) => {
	const newUrlQueryArgs = useMemo( () => {
		if ( ! currentPostId ) {
			return urlQueryArgs;
		}
		return {
			post_id: currentPostId,
			...urlQueryArgs,
		};
	}, [ currentPostId, urlQueryArgs ] );

	return <ServerSideRender urlQueryArgs={ newUrlQueryArgs } { ...props } />;
} );

if ( window && window.wp && window.wp.components ) {
	window.wp.components.ServerSideRender = forwardRef( ( props, ref ) => {
		deprecated( 'wp.components.ServerSideRender', {
			version: '6.2',
			since: '5.3',
			alternative: 'wp.serverSideRender',
		} );
		return <ExportedServerSideRender { ...props } ref={ ref } />;
	} );
}

export default ExportedServerSideRender;

const useExportedServerSideRender = ( {
	urlQueryArgs = EMPTY_OBJECT,
	...props
} ) => {
	const currentPostId = useSelect( ( select ) => {
		// FIXME: @wordpress/server-side-render should not depend on @wordpress/editor.
		// It is used by blocks that can be loaded into a *non-post* block editor.
		// eslint-disable-next-line @wordpress/data-no-store-string-literals
		const coreEditorSelect = select( 'core/editor' );
		if ( coreEditorSelect ) {
			const _currentPostId = coreEditorSelect.getCurrentPostId();
			// For templates and template parts we use a custom ID format.
			// Since they aren't real posts, we don't want to use their ID
			// for server-side rendering. Since they use a string based ID,
			// we can assume real post IDs are numbers.
			if ( _currentPostId && typeof _currentPostId === 'number' ) {
				return _currentPostId;
			}
		}
		return null;
	}, [] );

	const newUrlQueryArgs = useMemo( () => {
		if ( currentPostId === null ) {
			return urlQueryArgs;
		}
		return {
			post_id: currentPostId,
			...urlQueryArgs,
		};
	}, [ currentPostId, urlQueryArgs ] );

	return useServerSideRender( { urlQueryArgs: newUrlQueryArgs, ...props } );
};

export { useExportedServerSideRender as useServerSideRender };
