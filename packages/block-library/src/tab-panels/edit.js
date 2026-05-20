/**
 * WordPress dependencies
 */
import {
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import AddTabToolbarControl from '../tab-panel/add-tab-toolbar-control';
import RemoveTabToolbarControl from '../tab-panel/remove-tab-toolbar-control';

/**
 * Initial template applied only when the block is first inserted (i.e. when
 * inner blocks are empty). templateLock is false, so this is never applied to
 * existing blocks that already have tab panels saved.
 */
const TAB_PANELS_TEMPLATE = [
	[ 'core/tab-panel', { label: __( 'Tab' ) } ],
	[ 'core/tab-panel', { label: __( 'Tab' ) } ],
];

export default function Edit( { clientId } ) {
	const blockProps = useBlockProps();

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: TAB_PANELS_TEMPLATE,
		templateLock: false,
		renderAppender: false, // Appender handled by individual tab blocks
	} );

	// Get the parent tabs block clientId
	const tabsClientId = useSelect(
		( select ) =>
			select( blockEditorStore ).getBlockRootClientId( clientId ),
		[ clientId ]
	);

	return (
		<>
			<AddTabToolbarControl tabsClientId={ tabsClientId } />
			<RemoveTabToolbarControl tabsClientId={ tabsClientId } />
			<div { ...innerBlocksProps } />
		</>
	);
}
