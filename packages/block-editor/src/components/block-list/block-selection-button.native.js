/**
 * WordPress dependencies
 */
import { Icon } from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';

/**
 * External dependencies
 */
import { View, Text, TouchableOpacity } from 'react-native';

/**
 * Internal dependencies
 */
import BlockTitle from '../block-title';
import useBlockDisplayInformation from '../use-block-display-information';
import { store as blockEditorStore } from '../../store';
import styles from './block-selection-button.scss';

const BlockSelectionButton = ( { clientId, rootClientId } ) => {
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
					/* Open BottomSheet with markup */
				} }
				disabled={
					true
				} /* Disable temporarily since onPress function is empty */
			>
				<Icon
					size={ 24 }
					icon={ blockInformation?.icon?.src }
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
		const { getBlockRootClientId } = select( blockEditorStore );
		const rootClientId = getBlockRootClientId( clientId );

		if ( ! rootClientId ) {
			return { clientId };
		}

		return {
			clientId,
			rootClientId,
		};
	} ),
] )( BlockSelectionButton );
