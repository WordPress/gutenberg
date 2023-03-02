/**
 * WordPress dependencies
 */
import {
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
	BlockList,
	BlockTools,
} from '@wordpress/block-editor';
import { useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { unlock } from '../../private-apis';

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
	'core/page-list': [ 'core/page-list-item' ],
};

export default function NavigationMenuContent( { innerBlocks, onSelect } ) {
	const { clientIdsTree } = useSelect( ( select ) => {
		const { __unstableGetClientIdsTree } = select( blockEditorStore );
		return {
			clientIdsTree: __unstableGetClientIdsTree(),
		};
	} );
	const { updateBlockListSettings } = useDispatch( blockEditorStore );

	const { OffCanvasEditor, LeafMoreMenu } = unlock( blockEditorPrivateApis );

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

	// The hidden block is needed because it makes block edit side effects trigger.
	// For example a navigation page list load its items has an effect on edit to load its items.
	return (
		<>
			<OffCanvasEditor
				blocks={ clientIdsTree }
				onSelect={ onSelect }
				LeafMoreMenu={ LeafMoreMenu }
				showAppender={ false }
			/>
			<div style={ { display: 'none' } }>
				<BlockTools>
					<BlockList />
				</BlockTools>
			</div>
		</>
	);
}
