/**
 * External dependencies
 */
import { TextInput, TouchableWithoutFeedback, View } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { compose } from '@wordpress/compose';
import { decodeEntities } from '@wordpress/html-entities';
import { withSelect, withDispatch } from '@wordpress/data';

export function DefaultBlockAppender( {
	isLocked,
	isVisible,
	onAppend,
	placeholder,
} ) {
	if ( isLocked || ! isVisible ) {
		return null;
	}

	const value = decodeEntities( placeholder ) || __( 'Start writing or press \u2295 to choose a block' );

	return (
		<TouchableWithoutFeedback
			onPress={ onAppend }
		>
			<View style={ { flex: 1 } } pointerEvents="box-only">
				<TextInput
					textAlignVertical="top"
					multiline
					numberOfLines={ 0 }
					value={ value }
				/>
			</View>
		</TouchableWithoutFeedback>
	);
}
export default compose(
	withSelect( ( select, ownProps ) => {
		const { getBlockCount, getEditorSettings, getTemplateLock } = select( 'core/editor' );

		const isEmpty = ! getBlockCount( ownProps.rootClientId );
		const { bodyPlaceholder } = getEditorSettings();

		return {
			isVisible: isEmpty,
			isLocked: !! getTemplateLock( ownProps.rootClientId ),
			placeholder: bodyPlaceholder,
		};
	} ),
	withDispatch( ( dispatch, ownProps ) => {
		const {
			insertDefaultBlock,
			startTyping,
		} = dispatch( 'core/editor' );

		return {
			onAppend() {
				const { rootClientId } = ownProps;

				insertDefaultBlock( undefined, rootClientId );
				startTyping();
			},
		};
	} ),
)( DefaultBlockAppender );
