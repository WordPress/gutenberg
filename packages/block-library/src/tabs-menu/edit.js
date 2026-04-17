/**
 * WordPress dependencies
 */
import {
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import AddTabToolbarControl from '../tab/add-tab-toolbar-control';
import RemoveTabToolbarControl from '../tab/remove-tab-toolbar-control';

function Edit( { clientId } ) {
	const tabsClientId = useSelect(
		( select ) =>
			select( blockEditorStore ).getBlockRootClientId( clientId ),
		[ clientId ]
	);

	const blockProps = useBlockProps();

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: [ 'core/tabs-menu-item' ],
		orientation: 'horizontal',
		templateLock: false,
		renderAppender: false,
	} );

	return (
		<>
			<AddTabToolbarControl tabsClientId={ tabsClientId } />
			<RemoveTabToolbarControl tabsClientId={ tabsClientId } />
			<div { ...innerBlocksProps } />
		</>
	);
}

export default Edit;
