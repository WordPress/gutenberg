/**
 * External dependencies
 */
import { View, Alert, TextInput } from 'react-native';

/**
 * WordPress dependencies
 */
import { RichText, BlockControls } from '@wordpress/block-editor';
import { ToolbarGroup, ToolbarButton, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { search } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { buttonWithIcon, toggleLabel } from './icons';
import ButtonPositionDropdown from './button-position-dropdown';
import styles from './style.scss';
import TextButton from './text-button';

export default function SearchEdit( { attributes, setAttributes } ) {
	const {
		label,
		showLabel,
		buttonPosition,
		buttonUseIcon,
		placeholder,
		buttonText,
	} = attributes;

	// Temporary. Will be removed when styling is implemented
	// in a future PR.
	const alert = ( message ) => {
		Alert.alert( '', message, [ { text: 'OK' } ], { cancelable: true } );
	};

	const controls = (
		<BlockControls>
			<ToolbarGroup>
				<ToolbarButton
					title={ __( 'Toggle search label' ) }
					icon={ toggleLabel }
					onClick={ () => {
						setAttributes( {
							showLabel: ! showLabel,
						} );
					} }
					isActive={ showLabel }
				/>

				<ButtonPositionDropdown
					selectedOption={ buttonPosition }
					onChange={ ( position ) => {
						setAttributes( {
							buttonPosition: position,
						} );

						// Temporary. Will be removed when styling is implemented
						// in a future PR.
						alert( `Button position: ${ position }` );
					} }
				/>

				{ 'no-button' !== buttonPosition && (
					<ToolbarButton
						title={ __( 'Use button with icon' ) }
						icon={ buttonWithIcon }
						onClick={ () => {
							setAttributes( {
								buttonUseIcon: ! buttonUseIcon,
							} );

							// Temporary. Will be removed when styling is implemented
							// in a future PR.
							alert( `Icon only button: ${ ! buttonUseIcon }` );
						} }
						isActive={ buttonUseIcon }
					/>
				) }
			</ToolbarGroup>
		</BlockControls>
	);

	const renderTextField = () => {
		return (
			<TextInput
				style={ styles.searchTextInput }
				label={ null }
				value={ placeholder }
				placeholder={
					placeholder ? undefined : __( 'Optional placeholder…' )
				}
				onChangeText={ ( newVal ) =>
					setAttributes( { placeholder: newVal } )
				}
			/>
		);
	};

	const renderButton = () => {
		return (
			<View>
				{ buttonUseIcon && (
					<View>
						<Button icon={ search } />
					</View>
				) }

				{ ! buttonUseIcon && (
					<TextButton
						placeholder={ __( 'Add button text' ) }
						value={ buttonText }
						onChange={ ( html ) =>
							setAttributes( { buttonText: html } )
						}
					/>
				) }
			</View>
		);
	};

	return (
		<View>
			{ controls }

			{ showLabel && (
				<RichText
					aria-label={ __( 'Label text' ) }
					placeholder={ __( 'Add label…' ) }
					withoutInteractiveFormatting
					value={ label }
					onChange={ ( html ) => setAttributes( { label: html } ) }
				/>
			) }

			{ ( 'button-inside' === buttonPosition ||
				'button-outside' === buttonPosition ) && (
				<View style={ styles.searchBarContainer }>
					{ renderTextField() }
					{ renderButton() }
				</View>
			) }

			{ 'button-only' === buttonPosition && renderButton() }
			{ 'no-button' === buttonPosition && renderTextField() }
		</View>
	);
}
