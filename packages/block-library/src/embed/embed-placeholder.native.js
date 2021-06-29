/**
 * External dependencies
 */
import { View, Text, TouchableWithoutFeedback } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
import { useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import {
	useBlockEditContext,
	store as blockEditorStore,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import EmbedBottomSheet from './embed-bottom-sheet';
import styles from './styles.scss';

const EmbedPlaceholder = ( {
	icon,
	isSelected,
	label,
	onFocus,
	value,
	onSubmit,
} ) => {
	const { clientId } = useBlockEditContext();
	const { wasBlockJustInserted } = useSelect(
		( select ) => ( {
			wasBlockJustInserted: select(
				blockEditorStore
			).wasBlockJustInserted( clientId, 'inserter_menu' ),
		} ),
		[ clientId ]
	);
	const [ isEmbedSheetVisible, setIsEmbedSheetVisible ] = useState(
		isSelected && wasBlockJustInserted && ! value
	);

	const emptyStateContainerStyle = usePreferredColorSchemeStyle(
		styles.emptyStateContainer,
		styles.emptyStateContainerDark
	);

	const emptyStateTitleStyle = usePreferredColorSchemeStyle(
		styles.emptyStateTitle,
		styles.emptyStateTitleDark
	);

	return (
		<>
			{ value ? (
				<Text>{ value }</Text>
			) : (
				<TouchableWithoutFeedback
					accessibilityRole={ 'button' }
					accessibilityHint={ __( 'Double tap to add a link.' ) }
					onPress={ ( event ) => {
						onFocus( event );
						setIsEmbedSheetVisible( true );
					} }
				>
					<View style={ emptyStateContainerStyle }>
						<View style={ styles.modalIcon }>{ icon }</View>
						<Text style={ emptyStateTitleStyle }>{ label }</Text>
						<Text style={ styles.emptyStateDescription }>
							{ __( 'ADD LINK' ) }
						</Text>
					</View>
				</TouchableWithoutFeedback>
			) }
			<EmbedBottomSheet
				value={ value }
				isVisible={ isEmbedSheetVisible }
				onClose={ () => setIsEmbedSheetVisible( false ) }
				onSubmit={ onSubmit }
			/>
		</>
	);
};

export default EmbedPlaceholder;
