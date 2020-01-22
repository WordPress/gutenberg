/**
 * WordPress dependencies
 */
import { BlockEditorProvider, BlockList } from '@wordpress/block-editor';
import { Button, ModalHeaderBar } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Modal, View, SafeAreaView, Text, TouchableOpacity } from 'react-native';

/**
 * Internal dependencies
 */
import styles from './styles.scss';

// We are replicating this here because the one in @wordpress/block-editor always
// tries to scale the preview and we would need a lot of cross platform code to handle
// sizes, when we actually want to show the preview at full width.
//
// We can make it work here first, then figure out the right way to consolidate
// both implementations
const BlockPreview = ( { blocks } ) => {
	const currentSettings = useSelect( ( select ) => {
		return select( 'core/block-editor' ).getSettings();
	} );
	const settings = {
		...currentSettings,
		readOnly: true,
	};

	return (
		<BlockEditorProvider
			value={ blocks }
			settings={ settings }
		>
			<View style={ { flex: 1 } }>
				<BlockList />
			</View>
		</BlockEditorProvider>
	);
};
BlockPreview.displayName = 'BlockPreview';

const Preview = ( props ) => {
	const { template, onDismiss, onApply } = props;

	if ( template === undefined ) {
		return null;
	}

	const leftButton = (
		<View
			style={ { flex: 1, width: 44 } }
		>
			<Button
				icon="no-alt"
				size={ 24 }
				label={ __( 'Close' ) }
				onClick={ onDismiss }
			/>
		</View>
	);

	const rightButton = (
		<View
			style={ styles.headerRightButton }
		>
			<TouchableOpacity onPress={ onApply }>
				<Text>{ __( 'Apply' ) }</Text>
			</TouchableOpacity>
		</View>
	);

	return (
		<Modal
			visible={ !! template }
			animationType="slide"
			onRequestClose={ onDismiss }
		>
			<SafeAreaView style={ { flex: 1 } }>
				<ModalHeaderBar
					leftButton={ leftButton }
					rightButton={ rightButton }
					title={ template.name }
				/>
				<BlockPreview
					blocks={ template.blocks }
				/>
			</SafeAreaView>
		</Modal>
	);
};
Preview.displayName = 'TemplatePreview';

export default Preview;
