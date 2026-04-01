/**
 * External dependencies
 */
import clsx from 'clsx';

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

function Edit( { clientId, __unstableLayoutClassNames: layoutClassNames } ) {
	const { tabsClientId } = useSelect(
		( select ) => ( {
			tabsClientId:
				select( blockEditorStore ).getBlockRootClientId( clientId ),
		} ),
		[ clientId ]
	);

	const blockProps = useBlockProps( {
		className: clsx( layoutClassNames ),
		role: 'tablist',
	} );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: [ 'core/tabs-menu-item' ],
		orientation: 'horizontal',
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
