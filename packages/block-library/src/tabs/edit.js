/**
 * WordPress dependencies
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import TabToolbarControls from './tab-toolbar-controls';
import useTabListItemsSync from './use-tab-list-items-sync';

/**
 * Only the two structural child blocks are specified here — without inner
 * block entries for core/tab-list or core/tab-panels.
 *
 * If inner blocks were included in this template, `synchronizeBlocksWithTemplate`
 * (called whenever templateLock === 'all') would recurse into the containers and
 * truncate them to the template count, causing data loss when a saved block with
 * more than two tabs is re-opened in the editor.
 *
 * Initial tab/panel creation is delegated to the tab-panels template in
 * tab-panels/edit.js (templateLock: false, applied only when empty).
 */
const TABS_TEMPLATE = [ [ 'core/tab-list' ], [ 'core/tab-panels' ] ];

function Edit( { clientId } ) {
	useTabListItemsSync( clientId );

	const blockProps = useBlockProps();

	const innerBlockProps = useInnerBlocksProps( blockProps, {
		__experimentalCaptureToolbars: true,
		template: TABS_TEMPLATE,
		templateLock: 'all',
		renderAppender: false,
	} );

	return (
		<div { ...innerBlockProps }>
			<TabToolbarControls tabsClientId={ clientId } />
			{ innerBlockProps.children }
		</div>
	);
}

export default Edit;
