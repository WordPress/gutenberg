/**
 * WordPress dependencies
 */
import { BlockEditorProvider, BlockList } from '@wordpress/block-editor';
import { ModalHeaderBar } from '@wordpress/components';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { subscribeAndroidModalClosed } from '@wordpress/react-native-bridge';

/**
 * External dependencies
 */
import { Modal, Platform, View, SafeAreaView } from 'react-native';

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

	const header = <View style={ styles.previewHeader } />;

	return (
		<BlockEditorProvider value={ blocks } settings={ settings }>
			<View style={ { flex: 1 } }>
				<BlockList header={ header } />
			</View>
		</BlockEditorProvider>
	);
};
BlockPreview.displayName = 'BlockPreview';

const ModalPreview = ( props ) => {
	const { template, onDismiss, onApply } = props;
	const previewContainerStyle = usePreferredColorSchemeStyle(
		styles.previewContainer,
		styles.previewContainerDark
	);
	const androidModalClosedSubscription = useRef();

	useEffect( () => {
		if ( Platform.OS === 'android' ) {
			androidModalClosedSubscription.current = subscribeAndroidModalClosed(
				() => {
					onDismiss();
				}
			);
		}

		return () => {
			if (
				androidModalClosedSubscription &&
				androidModalClosedSubscription.current
			) {
				androidModalClosedSubscription.current.remove();
			}
		};
	}, [] );

	if ( template === undefined ) {
		return null;
	}

	const leftButton = <ModalHeaderBar.CloseButton onPress={ onDismiss } />;

	const rightButton = (
		<ModalHeaderBar.Button
			onPress={ onApply }
			title={ __( 'Apply' ) }
			isPrimary={ true }
		/>
	);

	return (
		<Modal
			visible={ !! template }
			animationType="slide"
			onRequestClose={ onDismiss }
			supportedOrientations={ [ 'portrait', 'landscape' ] }
		>
			<SafeAreaView style={ previewContainerStyle }>
				<ModalHeaderBar
					leftButton={ leftButton }
					rightButton={ rightButton }
					title={ template.name }
					subtitle={ __( 'Template Preview' ) }
				/>
				<Preview blocks={ template.blocks } />
			</SafeAreaView>
		</Modal>
	);
};
ModalPreview.displayName = 'TemplatePreview';

export const Preview = ( props ) => {
	const { blocks } = props;
	const previewContentStyle = usePreferredColorSchemeStyle(
		styles.previewContent,
		styles.previewContentDark
	);

	if ( blocks === undefined ) {
		return null;
	}
	return (
		<View style={ previewContentStyle }>
			<BlockPreview blocks={ blocks } />
		</View>
	);
};

export default ModalPreview;
