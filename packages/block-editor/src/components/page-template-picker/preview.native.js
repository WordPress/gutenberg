/**
 * WordPress dependencies
 */
import { BlockEditorProvider, BlockList } from '@wordpress/block-editor';
import { BottomSheet } from '@wordpress/components';
import { useSelect } from '@wordpress/data';

/**
 * External dependencies
 */
import { View, Text, Modal } from 'react-native';

// We are replicating this here because the one in @wordpress/block-editor always
// tries to scale the preview and we would need a lot of cross platform code to handle
// sizes, when we actually want to show the preview at full width.
//
// We can make it work here first, then figure out the right way to consolidate
// both implementations
const BlockPreview = ( { blocks } ) => {
	const settings = useSelect( ( select ) => {
		return select( 'core/block-editor' ).getSettings()
	} );

	return (
		<BlockEditorProvider
			value={ blocks }
			settings={ settings }
		>
			<View  style={{minHeight: '50%'}}>
				<BlockList isPreview={ true } />
			</View>
		</BlockEditorProvider>
	);
};

const Preview = ( props ) => {
	const { template, onDismiss } = props;
	if ( template === undefined ) {
		return null;
	}

	return (
		<BottomSheet
			title={ template.name }
			isVisible={ !! template }
			onClose={ onDismiss }
		>
			<View>
				<BlockPreview blocks={ template.blocks } />
			</View>
		</BottomSheet>
	);
};
Preview.displayName = 'TemplatePreview';

export default Preview;
