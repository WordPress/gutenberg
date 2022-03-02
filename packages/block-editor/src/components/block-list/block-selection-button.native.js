/**
 * WordPress dependencies
 */
import { Icon } from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { getBlockType } from '@wordpress/blocks';
import { BlockIcon } from '@wordpress/block-editor';

/**
 * External dependencies
 */
import { View, Text, TouchableOpacity } from 'react-native';

/**
 * Internal dependencies
 */
import BlockTitle from '../block-title';
import useBlockDisplayInformation from '../use-block-display-information';
import SubdirectorSVG from './subdirectory-icon';
import { store as blockEditorStore } from '../../store';
import styles from './block-selection-button.scss';

const BlockSelectionButton = ( {
	clientId,
	rootClientId,
	rootBlockIcon,
	isRTL,
} ) => {
	const blockInformation = useBlockDisplayInformation( clientId );
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
					/* Open BottomSheet with markup. */
				} }
				disabled={
					true
				} /* Disable temporarily since onPress function is empty. */
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
				{ blockInformation?.icon && (
					<BlockIcon
						size={ 24 }
						icon={ blockInformation.icon }
						fill={ styles.icon.color }
					/>
				) }
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
			blockEditorStore
		);
		const rootClientId = getBlockRootClientId( clientId );

		if ( ! rootClientId ) {
			return { clientId };
		}
		const rootBlockName = getBlockName( rootClientId );
		const rootBlockType = getBlockType( rootBlockName );
		const rootBlockIcon = rootBlockType ? rootBlockType.icon : {};

		return {
			clientId,
			rootClientId,
			rootBlockIcon,
			isRTL: getSettings().isRTL,
		};
	} ),
] )( BlockSelectionButton );
