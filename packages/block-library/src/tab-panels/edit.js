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
import TabToolbarControls from '../tabs/tab-toolbar-controls';

export default function Edit( { clientId } ) {
	const blockProps = useBlockProps();

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
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
			<TabToolbarControls tabsClientId={ tabsClientId } />
			<div { ...innerBlocksProps } />
		</>
	);
}
