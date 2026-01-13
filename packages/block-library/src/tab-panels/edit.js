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

const TAB_PANELS_TEMPLATE = [ [ 'core/tab', {} ] ];

export default function Edit( { attributes, clientId } ) {
	const blockProps = useBlockProps();

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: TAB_PANELS_TEMPLATE,
		templateLock: false,
		renderAppender: false, // Appender handled by individual tab blocks
	} );

	// Get the parent tabs block clientId
	const tabsClientId = useSelect(
		( select ) => {
			const { getBlockRootClientId } = select( blockEditorStore );
			return getBlockRootClientId( clientId );
		},
		[ clientId ]
	);

	return (
		<>
			<AddTabToolbarControl
				tabsClientId={ tabsClientId }
			/>
			<div { ...innerBlocksProps } />
		</>
	);
}
