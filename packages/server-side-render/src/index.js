/**
 * WordPress dependencies
 */
import { useMemo, forwardRef } from '@wordpress/element';
import { withSelect } from '@wordpress/data';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import ServerSideRender from './server-side-render';

/**
 * Constants
 */
const EMPTY_OBJECT = {};

const ExportedServerSideRender = withSelect( ( select ) => {
	const coreEditorSelect = select( 'core/editor' );
	if ( coreEditorSelect ) {
		const currentPostId = coreEditorSelect.getCurrentPostId();
		if ( currentPostId ) {
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
			alternative: 'wp.serverSideRender',
		} );
		return <ExportedServerSideRender { ...props } ref={ ref } />;
	} );
}

export default ExportedServerSideRender;
