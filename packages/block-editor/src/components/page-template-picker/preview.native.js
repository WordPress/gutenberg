/**
 * WordPress dependencies
 */
import { BlockEditorProvider, BlockList } from '@wordpress/block-editor';
import { BottomSheet } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { Dimensions, View, ScrollView, StyleSheet, Text } from 'react-native';
import Modal from 'react-native-modal';

const useScreenDimensions = ( dimension = 'window' ) => {
	const [ dimensions, setDimensions ] = useState( Dimensions.get( dimension ) );

	useEffect( () => {
		const onChange = result => {
		setDimensions( result[ dimension ] );
		};

		Dimensions.addEventListener( 'change', onChange );

		return () => Dimensions.removeEventListener( 'change', onChange );
	} );

	return dimensions;
};

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
	const { height: windowHeight } = useScreenDimensions();
	const style = StyleSheet.create( {
		container: {
			height: windowHeight - 150,
		},
	} );

	return (
		<BlockEditorProvider
			value={ blocks }
			settings={ settings }
		>
			<View style={ style.container }>
				<BlockList />
			</View>
		</BlockEditorProvider>
	);
};
BlockPreview.displayName = 'BlockPreview';

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
			<BlockPreview blocks={ template.blocks } />
		</BottomSheet>
	);
};
Preview.displayName = 'TemplatePreview';

export default Preview;
