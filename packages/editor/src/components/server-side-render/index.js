/**
 * WordPress dependencies
 */
import { ServerSideRender } from '@wordpress/components';
import { select } from '@wordpress/data';

export default function( { urlQueryArgs = {}, ...props } ) {
	const { getCurrentPostId } = select( 'core/editor' );

	urlQueryArgs = {
		post_id: getCurrentPostId(),
		...urlQueryArgs,
	};

	return (
		<ServerSideRender urlQueryArgs={ urlQueryArgs } { ...props } />
	);
}
