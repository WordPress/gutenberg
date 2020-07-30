/**
 * WordPress dependencies
 */
import { parse, createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { resolveSidebars, select, dispatch } from './controls';
import {
	KIND,
	POST_TYPE,
	buildSidebarsPostsQuery,
	buildSidebarPostId,
} from './utils';

export function* getSidebarsPosts() {
	const postsQuery = buildSidebarsPostsQuery();

	// Dispatch startResolution to skip the execution of the real getEntityRecord resolver - it would
	// issue an http request and fail.
	const args = [ KIND, POST_TYPE, postsQuery ];
	yield dispatch( 'core', 'startResolution', 'getEntityRecords', args );

	yield resolveSidebars();
	const sidebars = yield select( 'core', 'getSidebars' );
	const posts = sidebars.map( ( sidebar ) => {
		const widgetAreaBlock = createWidgetAreaBlock( sidebar );
		return createStubPost( sidebar.id, widgetAreaBlock );
	} );

	yield persistPosts( posts, postsQuery );

	// Dispatch finishResolution to conclude startResolution dispatched earlier
	yield dispatch( 'core', 'finishResolution', 'getEntityRecords', args );
}

const createStubPost = ( sidebarId, widgetAreaBlock ) => {
	const id = buildSidebarPostId( sidebarId );
	return {
		id,
		slug: id,
		status: 'draft',
		type: 'sidebar-page',
		blocks: [ widgetAreaBlock ],
		meta: {
			sidebarId,
		},
	};
};

const persistPosts = ( posts, query ) =>
	dispatch( 'core', 'receiveEntityRecords', KIND, POST_TYPE, posts, query );

/**
 * Converts a list of widgets into a widget-area block.
 *
 * @param {Array} sidebar a list of widgets
 * @return {Object} Navigation block
 */
function createWidgetAreaBlock( sidebar ) {
	return createBlock(
		'core/widget-area',
		{
			id: sidebar.id,
			name: sidebar.name,
		},
		sidebar.widgets.flatMap( convertWidgetToBlock )
	);
}

function convertWidgetToBlock( widget ) {
	// @TODO: filter based on something that's less likely to change or be translated
	if ( widget.name === 'Gutenberg Block' ) {
		const parsedBlocks = parse( widget.settings.content );
		if ( ! parsedBlocks.length ) {
			// @TODO: an empty block
			return createBlock( 'core/paragraph', {}, [] );
		}
	}

	// @TODO: reuse the rendered string we got from the API
	return createBlock(
		'core/legacy-widget',
		{
			id: widget.id,
		},
		[]
	);
}
