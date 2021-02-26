/**
 * External dependencies
 */
import { View, Alert, TextInput } from 'react-native';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	RichText,
	BlockControls,
	useBlockProps,
} from '@wordpress/block-editor';
import { ToolbarGroup, ToolbarButton, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { search } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { buttonWithIcon, toggleLabel } from './icons';
import ButtonPositionDropdown from './button-position-dropdown';
import styles from './style.scss';
import richTextStyles from './rich-text.scss';

const MIN_BUTTON_WIDTH = 100;

export default function SearchEdit( { attributes, setAttributes, className } ) {
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

	const getBlockClassNames = () => {
		return classnames(
			className,
			'button-inside' === buttonPosition
				? 'wp-block-search__button-inside'
				: undefined,
			'button-outside' === buttonPosition
				? 'wp-block-search__button-outside'
				: undefined,
			'no-button' === buttonPosition
				? 'wp-block-search__no-button'
				: undefined,
			'button-only' === buttonPosition
				? 'wp-block-search__button-only'
				: undefined,
			! buttonUseIcon && 'no-button' !== buttonPosition
				? 'wp-block-search__text-button'
				: undefined,
			buttonUseIcon && 'no-button' !== buttonPosition
				? 'wp-block-search__icon-button'
				: undefined
		);
	};

	const blockProps = useBlockProps( {
		className: getBlockClassNames(),
	} );

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
				className="wp-block-search__input"
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
			<View style={ styles.buttonContainer }>
				{ buttonUseIcon && (
					<Button
						className="wp-block-search__button"
						icon={ search }
					/>
				) }

				{ ! buttonUseIcon && (
					<RichText
						className="wp-block-search__button"
						style={ richTextStyles.searchButton }
						placeholder={ __( 'Add button text' ) }
						value={ buttonText }
						identifier="text"
						withoutInteractiveFormatting
						onChange={ ( html ) =>
							setAttributes( { buttonText: html } )
						}
						minWidth={ MIN_BUTTON_WIDTH }
						textAlign="center"
					/>
				) }
			</View>
		);
	};

	return (
		<View { ...blockProps } style={ styles.searchBlockContainer }>
			{ controls }

			{ showLabel && (
				<RichText
					className="wp-block-search__label"
					style={ {
						...styles.searchLabel,
						...richTextStyles.searchLabel,
					} }
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
