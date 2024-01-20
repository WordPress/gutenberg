/**
 * External dependencies
 */
import {
	ScrollView,
	View,
	Text,
	TouchableWithoutFeedback,
	Platform,
} from 'react-native';

/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
import { createBlocksFromInnerBlocksTemplate } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import {
	PanelBody,
	BottomSheet,
	FooterMessageControl,
} from '@wordpress/components';
import { Icon, close } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import { store as blockEditorStore } from '../../store';
import InserterButton from '../inserter-button';

const hitSlop = { top: 22, bottom: 22, left: 22, right: 22 };

function BlockVariationPicker( { isVisible, onClose, clientId, variations } ) {
	const { replaceInnerBlocks } = useDispatch( blockEditorStore );
	const isIOS = Platform.OS === 'ios';

	const cancelButtonStyle = usePreferredColorSchemeStyle(
		styles.cancelButton,
		styles.cancelButtonDark
	);

	const leftButton = (
		<TouchableWithoutFeedback onPress={ onClose } hitSlop={ hitSlop }>
			<View>
				{ isIOS ? (
					<Text
						style={ cancelButtonStyle }
						maxFontSizeMultiplier={ 2 }
					>
						{ __( 'Cancel' ) }
					</Text>
				) : (
					<Icon
						icon={ close }
						size={ 24 }
						style={ styles.closeIcon }
					/>
				) }
			</View>
		</TouchableWithoutFeedback>
	);

	const onVariationSelect = ( variation ) => {
		replaceInnerBlocks(
			clientId,
			createBlocksFromInnerBlocksTemplate( variation.innerBlocks )
		);
		onClose();
	};

	return (
		<BottomSheet
			isVisible={ isVisible }
			onClose={ onClose }
			title={ __( 'Select a layout' ) }
			contentStyle={ styles.contentStyle }
			leftButton={ leftButton }
			testID="block-variation-modal"
		>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={ false }
				contentContainerStyle={ styles.contentContainerStyle }
				style={ styles.containerStyle }
			>
				{ variations.map( ( v ) => (
					<InserterButton
						item={ v }
						key={ v.name }
						onSelect={ () => onVariationSelect( v ) }
					/>
				) ) }
			</ScrollView>
			<PanelBody>
				<FooterMessageControl
					label={ __(
						'Note: Column layout may vary between themes and screen sizes'
					) }
				/>
			</PanelBody>
		</BottomSheet>
	);
}

export default BlockVariationPicker;
