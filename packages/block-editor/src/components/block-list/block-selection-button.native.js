/**
 * WordPress dependencies
 */
import { Icon } from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { getBlockType } from '@wordpress/blocks';

/**
 * External dependencies
 */
import { View, Text, TouchableOpacity } from 'react-native';

/**
 * Internal dependencies
 */
import BlockTitle from '../block-title';
import SubdirectorSVG from './subdirectory-icon';

import styles from './block-selection-button.scss';

const BlockSelectionButton = ( {
	clientId,
	blockIcon,
	rootClientId,
	rootBlockIcon,
	isRTL,
} ) => {
	return (
		<View
			style={ [
				styles.selectionButtonContainer,
				rootClientId && styles.densedPaddingLeft,
			] }
		>
			<TouchableOpacity
				style={ styles.button }
				onPress={ () => {
					/* Open BottomSheet with markup */
				} }
				disabled={
					true
				} /* Disable temporarily since onPress function is empty */
			>
				{ rootClientId &&
					rootBlockIcon && [
						<Icon
							key="parent-icon"
							size={ 24 }
							icon={ rootBlockIcon.src }
							fill={ styles.icon.color }
						/>,
						<View key="subdirectory-icon" style={ styles.arrow }>
							<SubdirectorSVG
								fill={ styles.arrow.color }
								isRTL={ isRTL }
							/>
						</View>,
					] }
				<Icon
					size={ 24 }
					icon={ blockIcon.src }
					fill={ styles.icon.color }
				/>
				<Text
					maxFontSizeMultiplier={ 1.25 }
					ellipsizeMode="tail"
					numberOfLines={ 1 }
					style={ styles.selectionButtonTitle }
				>
					<BlockTitle clientId={ clientId } />
				</Text>
			</TouchableOpacity>
		</View>
	);
};

export default compose( [
	withSelect( ( select, { clientId } ) => {
		const { getBlockRootClientId, getBlockName, getSettings } = select(
			'core/block-editor'
		);

		const blockName = getBlockName( clientId );
		const blockType = getBlockType( blockName );
		const blockIcon = blockType ? blockType.icon : {};

		const rootClientId = getBlockRootClientId( clientId );

		if ( ! rootClientId ) {
			return {
				clientId,
				blockIcon,
			};
		}
		const rootBlockName = getBlockName( rootClientId );
		const rootBlockType = getBlockType( rootBlockName );
		const rootBlockIcon = rootBlockType ? rootBlockType.icon : {};

		return {
			clientId,
			blockIcon,
			rootClientId,
			rootBlockIcon,
			isRTL: getSettings().isRTL,
		};
	} ),
] )( BlockSelectionButton );
