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
import { withSelect, useDispatch } from '@wordpress/data';
import { compose, usePreferredColorSchemeStyle } from '@wordpress/compose';
import {
	createBlocksFromInnerBlocksTemplate,
	store as blocksStore,
} from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import {
	PanelBody,
	BottomSheet,
	FooterMessageControl,
	InserterButton,
} from '@wordpress/components';
import { Icon, close } from '@wordpress/icons';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import { store as blockEditorStore } from '../../store';

const hitSlop = { top: 22, bottom: 22, left: 22, right: 22 };

function BlockVariationPicker( { isVisible, onClose, clientId, variations } ) {
	const { replaceInnerBlocks } = useDispatch( blockEditorStore );
	const isIOS = Platform.OS === 'ios';

	const cancelButtonStyle = usePreferredColorSchemeStyle(
		styles.cancelButton,
		styles.cancelButtonDark
	);

	const leftButton = useMemo(
		() => (
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
		),
		[ onClose, cancelButtonStyle ]
	);

	const onVariationSelect = ( variation ) => {
		replaceInnerBlocks(
			clientId,
			createBlocksFromInnerBlocksTemplate( variation.innerBlocks )
		);
		onClose();
	};

	return useMemo(
		() => (
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
					{ variations.map( ( v ) => {
						return (
							<InserterButton
								item={ v }
								key={ v.name }
								onSelect={ () => onVariationSelect( v ) }
							/>
						);
					} ) }
				</ScrollView>
				<PanelBody>
					<FooterMessageControl
						label={ __(
							'Note: Column layout may vary between themes and screen sizes'
						) }
					/>
				</PanelBody>
			</BottomSheet>
		),
		[ variations, isVisible, onClose ]
	);
}

export default compose(
	withSelect( ( select, {} ) => {
		const { getBlockVariations } = select( blocksStore );

		return {
			date: getBlockVariations( 'core/columns', 'block' ),
		};
	} )
)( BlockVariationPicker );
