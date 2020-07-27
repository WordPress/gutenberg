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
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { withSelect, useDispatch } from '@wordpress/data';
import { compose, usePreferredColorSchemeStyle } from '@wordpress/compose';
import { createBlock } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import {
	PanelBody,
	BottomSheet,
	UnsupportedFooterControl,
} from '@wordpress/components';
import { Icon, close } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import MenuItem from '../inserter/menu-item';
import styles from './style.scss';

function BlockVariationPicker( { isVisible, onClose, clientId, variations } ) {
	const createBlocksFromInnerBlocksTemplate = ( innerBlocksTemplate ) => {
		return map(
			innerBlocksTemplate,
			( [ name, attributes, innerBlocks = [] ] ) =>
				createBlock(
					name,
					attributes,
					createBlocksFromInnerBlocksTemplate( innerBlocks )
				)
		);
	};
	const { replaceInnerBlocks } = useDispatch( 'core/block-editor' );
	const hitSlop = { top: 22, bottom: 22, left: 22, right: 22 };
	const isIOS = Platform.OS === 'ios';

	const cancelButtonStyle = usePreferredColorSchemeStyle(
		styles.cancelButton,
		styles.cancelButtonDark
	);

	const onVariationSelect = ( variation ) => {
		replaceInnerBlocks(
			clientId,
			createBlocksFromInnerBlocksTemplate( variation.innerBlocks ),
			false
		);
		onClose();
	};

	return (
		<BottomSheet
			isVisible={ isVisible }
			onClose={ onClose }
			title={ __( 'Select a layout' ) }
			contentStyle={ styles.contentStyle }
			leftButton={
				<TouchableWithoutFeedback
					onPress={ onClose }
					hitSlop={ hitSlop }
				>
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
			}
		>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={ false }
				contentContainerStyle={ styles.contentContainerStyle }
				style={ styles.containerStyle }
			>
				{ variations.map( ( v ) => {
					return (
						<MenuItem
							item={ v }
							key={ v.name }
							onSelect={ () => onVariationSelect( v ) }
						/>
					);
				} ) }
			</ScrollView>
			<PanelBody>
				<UnsupportedFooterControl
					label={ __( 'Note: columns may stack on small screens' ) }
					textAlign="center"
				/>
			</PanelBody>
		</BottomSheet>
	);
}

export default compose(
	withSelect( ( select, {} ) => {
		const { getBlockVariations } = select( 'core/blocks' );

		return {
			date: getBlockVariations( 'core/columns', 'block' ),
		};
	} )
)( BlockVariationPicker );
