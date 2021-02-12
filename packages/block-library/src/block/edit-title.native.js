/**
 * External dependencies
 */
import { Text, View } from 'react-native';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { withPreferredColorScheme } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './editor.scss';

function EditTitle( { onClickEdit, onClickSave, isEditing } ) {
	const buttonText = isEditing ? __( 'Save' ) : __( 'Edit' );
	const buttonHandler = isEditing ? onClickSave : onClickEdit;

	return (
		<View style={ styles.titleContainer }>
			<View style={ styles.buttonContainer }>
				<Button
					isDefault
					onClick={ buttonHandler }
					fixedRatio={ false }
				>
					<Text style={ styles.saveButton }>{ buttonText }</Text>
				</Button>
			</View>
		</View>
	);
}

export default withPreferredColorScheme( EditTitle );
