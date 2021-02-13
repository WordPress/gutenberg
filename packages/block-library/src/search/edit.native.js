/**
 * External dependencies
 */
import { View, Alert } from 'react-native';

/**
 * WordPress dependencies
 */
import { RichText, BlockControls } from '@wordpress/block-editor';
import { ToolbarGroup, ToolbarButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { buttonWithIcon, toggleLabel } from './icons';
import ButtonPositionDropdown from './button-position-dropdown.native';

export default function SearchEdit( { attributes, setAttributes } ) {
	const { label, showLabel, buttonPosition, buttonUseIcon } = attributes;

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
		</View>
	);
}
