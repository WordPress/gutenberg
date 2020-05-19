/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Platform, useState } from '@wordpress/element';
import { Icon } from '@wordpress/components';
import { link, chevronRight } from '@wordpress/icons';
import { ExistingContentPicker } from '@wordpress/block-editor';
import { withPreferredColorScheme } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './styles.scss';
import platformStyles from './cellStyles.scss';
import Cell from './cell';

function LinkCell( {
	value,
	onChangeValue,
	onSubmit,
	onPickerOpen,
	onPickerResult,
	onPickerCancel,
	getStylesFromColorScheme,
} ) {
	const iconStyle = getStylesFromColorScheme( styles.icon, styles.iconDark );

	const [ isUrlFocused, setIsUrlFocused ] = useState();
	const shouldShowExistingContentPicker = ! ( value && isUrlFocused );

	return (
		<Cell
			icon={ link }
			label={ __( 'URL' ) }
			value={ value }
			placeholder={ __( 'Add URL' ) }
			autoCapitalize="none"
			autoCorrect={ false }
			keyboardType="url"
			onChangeValue={ onChangeValue }
			onSubmit={ onSubmit }
			/* eslint-disable-next-line jsx-a11y/no-autofocus */
			autoFocus={ Platform.OS === 'ios' }
			onFocus={ () => setIsUrlFocused( true ) }
			onBlur={ () => setIsUrlFocused( false ) }
		>
			{ shouldShowExistingContentPicker && (
				<>
					<View style={ platformStyles.labelIconSeparator } />
					<ExistingContentPicker
						currentUrl={ value }
						onOpen={ onPickerOpen }
						onResult={ onPickerResult }
						onCancel={ onPickerCancel }
					>
						<Icon
							icon={ chevronRight }
							size={ 24 }
							color={ iconStyle.color }
							isPressed={ false }
						/>
					</ExistingContentPicker>
				</>
			) }
		</Cell>
	);
}

export default withPreferredColorScheme( LinkCell );
