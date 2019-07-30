/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import ServerSideRender from './server-side-render';

/**
 * Constants
 */
const EMPTY_OBJECT = {};

export default withSelect(
	( select ) => {
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
	}
)(
	( { urlQueryArgs = EMPTY_OBJECT, currentPostId, ...props } ) => {
		const newUrlQueryArgs = useMemo( () => {
			if ( ! currentPostId ) {
				return urlQueryArgs;
			}
			return {
				post_id: currentPostId,
				...urlQueryArgs,
			};
		}, [ currentPostId, urlQueryArgs ] );

		return (
			<ServerSideRender urlQueryArgs={ newUrlQueryArgs } { ...props } />
		);
	}
);
