/**
 * External dependencies
 */
import { TouchableWithoutFeedback, View } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { RichText } from '@wordpress/editor';
import { compose } from '@wordpress/compose';
import { decodeEntities } from '@wordpress/html-entities';
import { withSelect, withDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import styles from './style.scss';

export function DefaultBlockAppender( {
	isLocked,
	isVisible,
	onAppend,
	placeholder,
	containerStyle,
} ) {
	if ( isLocked || ! isVisible ) {
		return null;
	}

	const value = decodeEntities( placeholder ) || __( 'Start writing…' );

	return (
		<TouchableWithoutFeedback
			onPress={ onAppend }
		>
			<View style={ [ styles.blockHolder, containerStyle ] } pointerEvents="box-only">
				<RichText
					placeholder={ value }
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
