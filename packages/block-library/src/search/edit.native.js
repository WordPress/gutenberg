/**
 * External dependencies
 */
import { View, TextInput, Platform } from 'react-native';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	RichText,
	useBlockProps,
	InspectorControls,
} from '@wordpress/block-editor';
import {
	Button,
	PanelBody,
	UnitControl,
	SelectControl,
	ToggleControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { search } from '@wordpress/icons';
import { useRef, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import richTextStyles from './rich-text.scss';
import {
	isPercentageUnit,
	CSS_UNITS,
	MIN_WIDTH,
	PC_WIDTH_DEFAULT,
	PX_WIDTH_DEFAULT,
} from './utils.js';

/**
 * Constants
 */
const MIN_BUTTON_WIDTH = 100;
const BUTTON_OPTIONS = [
	{ value: 'button-inside', label: __( 'Button inside' ) },
	{ value: 'button-outside', label: __( 'Button outside' ) },
	{ value: 'no-button', label: __( 'No button' ) },
];

export default function SearchEdit( {
	onFocus,
	isSelected,
	attributes,
	setAttributes,
	className,
} ) {
	const textInput = useRef();
	const isAndroid = Platform.OS === 'android';

	let timeoutRef = null;

	const {
		label,
		showLabel,
		buttonPosition,
		buttonUseIcon,
		placeholder,
		buttonText,
		width = 100,
		widthUnit = '%',
	} = attributes;

	/*
	 * Set the focus to the placeholder text when the block is first mounted (if the block
	 * if the block is selected).
	 */
	useEffect( () => {
		if ( textInput.current.isFocused() === false && isSelected ) {
			if ( isAndroid ) {
				/*
				 * There seems to be an issue in React Native where the keyboard doesn't show if called shortly after rendering.
				 * As a common work around this delay is used.
				 * https://github.com/facebook/react-native/issues/19366#issuecomment-400603928
				 */
				timeoutRef = setTimeout( () => {
					textInput.current.focus();
				}, 150 );
			} else {
				textInput.current.focus();
			}
		}
		return () => {
			// Clear the timeout when the component is unmounted
			if ( isAndroid ) {
				clearTimeout( timeoutRef );
			}
		};
	}, [] );

	const onChange = ( nextWidth ) => {
		if ( isPercentageUnit( widthUnit ) || ! widthUnit ) {
			return;
		}
		onChangeWidth( nextWidth );
	};

	const onChangeWidth = ( nextWidth ) => {
		setAttributes( {
			width: nextWidth,
			widthUnit,
		} );
	};

	const onChangeUnit = ( nextUnit ) => {
		setAttributes( {
			width: '%' === nextUnit ? PC_WIDTH_DEFAULT : PX_WIDTH_DEFAULT,
			widthUnit: nextUnit,
		} );
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

	const getSelectedButtonPositionLabel = ( option ) => {
		switch ( option ) {
			case 'button-inside':
				return __( 'Inside' );
			case 'button-outside':
				return __( 'Outside' );
			case 'no-button':
				return __( 'No button' );
		}
	};

	const blockProps = useBlockProps( {
		className: getBlockClassNames(),
	} );

	const controls = (
		<InspectorControls>
			<PanelBody title={ __( 'Search settings' ) }>
				<ToggleControl
					label={ __( 'Show search label' ) }
					checked={ showLabel }
					onChange={ () => {
						setAttributes( {
							showLabel: ! showLabel,
						} );
					} }
				/>
				<UnitControl
					label={ __( 'Width' ) }
					min={ widthUnit === '%' ? 1 : MIN_WIDTH }
					max={ isPercentageUnit( widthUnit ) ? 100 : undefined }
					decimalNum={ 1 }
					units={ CSS_UNITS }
					unit={ widthUnit }
					onChange={ onChange }
					onComplete={ onChangeWidth }
					onUnitChange={ onChangeUnit }
					value={ parseFloat( width ) }
				/>
			</PanelBody>
			<PanelBody title={ __( 'Button settings' ) }>
				<SelectControl
					label={ __( 'Button position' ) }
					value={ getSelectedButtonPositionLabel( buttonPosition ) }
					onChange={ ( position ) => {
						setAttributes( {
							buttonPosition: position,
						} );
					} }
					options={ BUTTON_OPTIONS }
					hideCancelButton={ true }
				/>
				<ToggleControl
					label={ __( 'Use icon button' ) }
					checked={ buttonUseIcon }
					onChange={ () => {
						setAttributes( {
							buttonUseIcon: ! buttonUseIcon,
						} );
					} }
				/>
			</PanelBody>
		</InspectorControls>
	);

	const mergeWithBorderStyle = ( style ) => {
		return { ...style, ...styles.border };
	};

	const renderTextField = () => {
		const inputStyle =
			buttonPosition === 'button-inside'
				? styles.searchTextInput
				: mergeWithBorderStyle( styles.searchTextInput );

		return (
			<TextInput
				ref={ textInput }
				className="wp-block-search__input"
				style={ inputStyle }
				numberOfLines={ 1 }
				ellipsizeMode="tail" // currently only works on ios
				label={ null }
				value={ placeholder }
				placeholder={
					placeholder ? undefined : __( 'Optional placeholder…' )
				}
				onChangeText={ ( newVal ) =>
					setAttributes( { placeholder: newVal } )
				}
				onFocus={ onFocus }
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
						onFocus={ onFocus }
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
						onFocus={ onFocus }
						isSelected={ false }
					/>
				) }
			</View>
		);
	};

	const searchBarStyle =
		buttonPosition === 'button-inside'
			? mergeWithBorderStyle( styles.searchBarContainer )
			: styles.searchBarContainer;

	return (
		<View { ...blockProps } style={ styles.searchBlockContainer }>
			{ isSelected && controls }

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
					onFocus={ onFocus }
					isSelected={ false }
				/>
			) }

			{ ( 'button-inside' === buttonPosition ||
				'button-outside' === buttonPosition ) && (
				<View style={ searchBarStyle }>
					{ renderTextField() }
					{ renderButton() }
				</View>
			) }

			{ 'button-only' === buttonPosition && renderButton() }
			{ 'no-button' === buttonPosition && renderTextField() }
		</View>
	);
}
