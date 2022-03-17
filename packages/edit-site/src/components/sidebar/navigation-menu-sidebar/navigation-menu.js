/**
 * WordPress dependencies
 */
import {
	__experimentalListView as ListView,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

const ALLOWED_BLOCKS = {
	'core/navigation': [
		'core/navigation-link',
		'core/search',
		'core/social-links',
		'core/page-list',
		'core/spacer',
		'core/home-link',
		'core/site-title',
		'core/site-logo',
		'core/navigation-submenu',
	],
	'core/social-links': [ 'core/social-link' ],
	'core/navigation-submenu': [
		'core/navigation-link',
		'core/navigation-submenu',
	],
	'core/navigation-link': [
		'core/navigation-link',
		'core/navigation-submenu',
	],
};

export default function NavigationMenu( { innerBlocks } ) {
	const { updateBlockListSettings } = useDispatch( blockEditorStore );

	//TODO: Block settings are normally updated as a side effect of rendering InnerBlocks in BlockList
	//Think through a better way of doing this, possible with adding allowed blocks to block library metadata
	useEffect( () => {
		updateBlockListSettings( '', {
			allowedBlocks: ALLOWED_BLOCKS[ 'core/navigation' ],
		} );
		innerBlocks.forEach( ( block ) => {
			if ( ALLOWED_BLOCKS[ block.name ] ) {
				updateBlockListSettings( block.clientId, {
					allowedBlocks: ALLOWED_BLOCKS[ block.name ],
				} );
			}
		} );
	}, [ updateBlockListSettings, innerBlocks ] );
	return (
		<>
			<ListView
				showNestedBlocks
				showBlockMovers
				__experimentalFeatures
				__experimentalPersistentListViewFeatures
			/>
		</>
	);
}
