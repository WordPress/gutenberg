/**
 * WordPress dependencies
 */
import {
	experiments as blockEditorExperiments,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { unlock } from '../../experiments';

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

export default function NavigationMenu( { innerBlocks, onSelect } ) {
	const { updateBlockListSettings } = useDispatch( blockEditorStore );

	const { OffCanvasEditor } = unlock( blockEditorExperiments );

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

	return <OffCanvasEditor blocks={ innerBlocks } onSelect={ onSelect } />;
}
