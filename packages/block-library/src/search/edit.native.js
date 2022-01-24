/**
 * External dependencies
 */
import { View, AccessibilityInfo } from 'react-native';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	RichText,
	PlainText,
	useBlockProps,
	InspectorControls,
} from '@wordpress/block-editor';
import {
	PanelBody,
	SelectControl,
	ToggleControl,
	Icon,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { search } from '@wordpress/icons';
import { useRef, useEffect, useState } from '@wordpress/element';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './style.scss';

/**
 * Constants
 */
const MIN_BUTTON_WIDTH = 75;
const MARGINS =
	styles.widthMargin?.marginLeft + styles.widthMargin?.paddingLeft;

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
	blockWidth,
	style,
} ) {
	const [ isButtonSelected, setIsButtonSelected ] = useState( false );
	const [ isLabelSelected, setIsLabelSelected ] = useState( false );
	const [ isPlaceholderSelected, setIsPlaceholderSelected ] = useState(
		false
	);
	const [ isLongButton, setIsLongButton ] = useState( false );
	const [ buttonWidth, setButtonWidth ] = useState( MIN_BUTTON_WIDTH );
	const [ isScreenReaderEnabled, setIsScreenReaderEnabled ] = useState(
		false
	);

	const textInputRef = useRef( null );

	const {
		label,
		showLabel,
		buttonPosition,
		buttonUseIcon,
		placeholder,
		buttonText,
	} = attributes;

	/*
	 * Check if screenreader is enabled and save to state. This is important for
	 * properly creating accessibilityLabel text.
	 */
	useEffect( () => {
		const a11yInfoChangeSubscription = AccessibilityInfo.addEventListener(
			'screenReaderChanged',
			handleScreenReaderToggled
		);

		AccessibilityInfo.isScreenReaderEnabled().then(
			( screenReaderEnabled ) => {
				setIsScreenReaderEnabled( screenReaderEnabled );
			}
		);

		return () => {
			a11yInfoChangeSubscription.remove();
		};
	}, [] );

	const handleScreenReaderToggled = ( screenReaderEnabled ) => {
		setIsScreenReaderEnabled( screenReaderEnabled );
	};

	/*
	 * Called when the value of isSelected changes. Blurs the PlainText component
	 * used by the placeholder when this block loses focus.
	 */
	useEffect( () => {
		if ( hasTextInput() && isPlaceholderSelected && ! isSelected ) {
			textInputRef.current.blur();
		}
	}, [ isSelected ] );

	useEffect( () => {
		const maxButtonWidth = Math.floor( blockWidth / 2 - MARGINS );
		const tempIsLongButton = buttonWidth > maxButtonWidth;

		// Update this value only if it has changed to avoid flickering.
		if ( isLongButton !== tempIsLongButton ) {
			setIsLongButton( tempIsLongButton );
		}
	}, [ blockWidth, buttonWidth ] );

	const hasTextInput = () => {
		return textInputRef && textInputRef.current;
	};

	const onLayoutButton = ( { nativeEvent } ) => {
		const { width } = nativeEvent?.layout;

		if ( width ) {
			setButtonWidth( width );
		}
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
					label={ __( 'Hide search heading' ) }
					checked={ ! showLabel }
					onChange={ () => {
						setAttributes( {
							showLabel: ! showLabel,
						} );
					} }
				/>
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
				{ buttonPosition !== 'no-button' && (
					<ToggleControl
						label={ __( 'Use icon button' ) }
						checked={ buttonUseIcon }
						onChange={ () => {
							setAttributes( {
								buttonUseIcon: ! buttonUseIcon,
							} );
						} }
					/>
				) }
			</PanelBody>
		</InspectorControls>
	);

	const isButtonInside = buttonPosition === 'button-inside';

	const borderStyle = usePreferredColorSchemeStyle(
		styles.border,
		styles.borderDark
	);

	const inputStyle = [
		! isButtonInside && borderStyle,
		usePreferredColorSchemeStyle(
			styles.plainTextInput,
			styles.plainTextInputDark
		),
		style?.baseColors?.color && { color: style?.baseColors?.color?.text },
	];

	const placeholderStyle = {
		...usePreferredColorSchemeStyle(
			styles.plainTextPlaceholder,
			styles.plainTextPlaceholderDark
		),
		...( style?.baseColors?.color && {
			color: style?.baseColors?.color?.text,
		} ),
	};

	const searchBarStyle = [
		styles.searchBarContainer,
		isButtonInside && borderStyle,
		isLongButton && { flexDirection: 'column' },
	];

	/**
	 * If a screenreader is enabled, create a descriptive label for this field. If
	 * not, return a label that is used during automated UI tests.
	 *
	 * @return {string} The accessibilityLabel for the Search Button
	 */
	const getAccessibilityLabelForButton = () => {
		if ( ! isScreenReaderEnabled ) {
			return 'search-block-button';
		}

		return `${ __(
			'Search button. Current button text is'
		) } ${ buttonText }`;
	};

	/**
	 * If a screenreader is enabled, create a descriptive label for this field. If
	 * not, return a label that is used during automated UI tests.
	 *
	 * @return {string} The accessibilityLabel for the Search Input
	 * 					 placeholder field.
	 */
	const getAccessibilityLabelForPlaceholder = () => {
		if ( ! isScreenReaderEnabled ) {
			return 'search-block-input';
		}

		const title = __( 'Search input field.' );
		const description = placeholder
			? `${ __( 'Current placeholder text is' ) } ${ placeholder }`
			: __( 'No custom placeholder set' );
		return `${ title } ${ description }`;
	};

	/**
	 * If a screenreader is enabled, create a descriptive label for this field. If
	 * not, return a label that is used during automated UI tests.
	 *
	 * @return {string} The accessibilityLabel for the Search Label field
	 */
	const getAccessibilityLabelForLabel = () => {
		if ( ! isScreenReaderEnabled ) {
			return 'search-block-label';
		}

		return `${ __( 'Search block label. Current text is' ) } ${ label }`;
	};

	const renderTextField = () => {
		return (
			<View
				style={ styles.searchInputContainer }
				accessible={ true }
				accessibilityRole="none"
				accessibilityHint={
					isScreenReaderEnabled
						? __( 'Double tap to edit placeholder text' )
						: undefined
				}
				accessibilityLabel={ getAccessibilityLabelForPlaceholder() }
			>
				<PlainText
					ref={ textInputRef }
					isSelected={ isPlaceholderSelected }
					className="wp-block-search__input"
					style={ inputStyle }
					numberOfLines={ 1 }
					ellipsizeMode="tail" // currently only works on ios
					label={ null }
					value={ placeholder }
					placeholder={
						placeholder ? undefined : __( 'Optional placeholder…' )
					}
					onChange={ ( newVal ) =>
						setAttributes( { placeholder: newVal } )
					}
					onFocus={ () => {
						setIsPlaceholderSelected( true );
						onFocus();
					} }
					onBlur={ () => setIsPlaceholderSelected( false ) }
					placeholderTextColor={ placeholderStyle?.color }
				/>
			</View>
		);
	};

	// To achieve proper expanding and shrinking `RichText` on Android, there is a need to set
	// a `placeholder` as an empty string when `RichText` is focused,
	// because `AztecView` is calculating a `minWidth` based on placeholder text.
	const buttonPlaceholderText =
		isButtonSelected ||
		( ! isButtonSelected && buttonText && buttonText !== '' )
			? ''
			: __( 'Add button text' );

	const baseButtonStyles = {
		...style?.baseColors?.blocks?.[ 'core/button' ]?.color,
		...attributes?.style?.color,
		...( style?.color && { text: style.color } ),
	};

	const richTextButtonContainerStyle = [
		styles.buttonContainer,
		isLongButton && styles.buttonContainerWide,
		baseButtonStyles?.background && {
			backgroundColor: baseButtonStyles.background,
			borderWidth: 0,
		},
		style?.backgroundColor && {
			backgroundColor: style.backgroundColor,
			borderWidth: 0,
		},
	];

	const richTextButtonStyle = {
		...styles.richTextButton,
		...( baseButtonStyles?.text && {
			color: baseButtonStyles.text,
			placeholderColor: baseButtonStyles.text,
		} ),
	};

	const iconStyles = {
		...styles.icon,
		...( baseButtonStyles?.text && { fill: baseButtonStyles.text } ),
	};

	const renderButton = () => {
		return (
			<View style={ richTextButtonContainerStyle }>
				{ buttonUseIcon && (
					<Icon
						icon={ search }
						{ ...iconStyles }
						onLayout={ onLayoutButton }
					/>
				) }

				{ ! buttonUseIcon && (
					<View
						accessible={ true }
						accessibilityRole="none"
						accessibilityHint={
							isScreenReaderEnabled
								? __( 'Double tap to edit button text' )
								: undefined
						}
						accessibilityLabel={ getAccessibilityLabelForButton() }
						onLayout={ onLayoutButton }
					>
						<RichText
							className="wp-block-search__button"
							identifier="text"
							tagName="p"
							style={ richTextButtonStyle }
							placeholder={ buttonPlaceholderText }
							value={ buttonText }
							withoutInteractiveFormatting
							onChange={ ( html ) =>
								setAttributes( { buttonText: html } )
							}
							minWidth={ MIN_BUTTON_WIDTH }
							maxWidth={ blockWidth - MARGINS }
							textAlign="center"
							isSelected={ isButtonSelected }
							__unstableMobileNoFocusOnMount={ ! isSelected }
							unstableOnFocus={ () => {
								setIsButtonSelected( true );
							} }
							onBlur={ () => {
								setIsButtonSelected( false );
							} }
							selectionColor={
								styles.richTextButtonCursor?.color
							}
						/>
					</View>
				) }
			</View>
		);
	};

	return (
		<View
			{ ...blockProps }
			style={ styles.searchBlockContainer }
			importantForAccessibility={
				isSelected ? 'yes' : 'no-hide-descendants'
			}
			accessibilityElementsHidden={ isSelected ? false : true }
		>
			{ isSelected && controls }

			{ showLabel && (
				<View
					accessible={ true }
					accessibilityRole="none"
					accessibilityHint={
						isScreenReaderEnabled
							? __( 'Double tap to edit label text' )
							: undefined
					}
					accessibilityLabel={ getAccessibilityLabelForLabel() }
				>
					<RichText
						className="wp-block-search__label"
						identifier="text"
						tagName="p"
						style={ styles.richTextLabel }
						placeholder={ __( 'Add label…' ) }
						withoutInteractiveFormatting
						value={ label }
						onChange={ ( html ) =>
							setAttributes( { label: html } )
						}
						isSelected={ isLabelSelected }
						__unstableMobileNoFocusOnMount={ ! isSelected }
						unstableOnFocus={ () => {
							setIsLabelSelected( true );
						} }
						onBlur={ () => {
							setIsLabelSelected( false );
						} }
						selectionColor={ styles.richTextButtonCursor?.color }
					/>
				</View>
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
