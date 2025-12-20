/**
 * External dependencies
 */
import { View, Text, TouchableOpacity } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
import { Icon, Picker } from '@wordpress/components';
import { BlockIcon } from '@wordpress/block-editor';
import { useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import styles from './styles.scss';
import { noticeOutline } from '../../../components/src/mobile/gridicons';

const hitSlop = { top: 22, bottom: 22, left: 22, right: 22 };

const EmbedPlaceholder = ( {
	icon,
	isSelected,
	label,
	onPress,
	cannotEmbed,
	fallback,
	tryAgain,
	openEmbedLinkSettings,
} ) => {
	const containerSelectedStyle = usePreferredColorSchemeStyle(
		styles[ 'embed__container-selected' ],
		styles[ 'embed__container-selected--dark' ]
	);
	const containerStyle = [
		usePreferredColorSchemeStyle(
			styles.embed__container,
			styles[ 'embed__container--dark' ]
		),
		isSelected && containerSelectedStyle,
	];
	const labelStyle = usePreferredColorSchemeStyle(
		styles.embed__label,
		styles[ 'embed__label--dark' ]
	);
	const descriptionStyle = styles.embed__description;
	const descriptionErrorStyle = styles[ 'embed__description--error' ];
	const actionStyle = usePreferredColorSchemeStyle(
		styles.embed__action,
		styles[ 'embed__action--dark' ]
	);
	const embedIconErrorStyle = styles[ 'embed__icon--error' ];

	const buttonStyles = usePreferredColorSchemeStyle(
		styles.embed__button,
		styles[ 'embed__button--dark' ]
	);
	const iconStyles = usePreferredColorSchemeStyle(
		styles.embed__icon,
		styles[ 'embed__icon--dark' ]
	);

	const cannotEmbedMenuPickerRef = useRef();

	const errorPickerOptions = {
		retry: {
			id: 'retryOption',
			label: __( 'Retry' ),
			value: 'retryOption',
			onSelect: tryAgain,
		},
		convertToLink: {
			id: 'convertToLinkOption',
			label: __( 'Convert to link' ),
			value: 'convertToLinkOption',
			onSelect: fallback,
		},
		editLink: {
			id: 'editLinkOption',
			label: __( 'Edit link' ),
			value: 'editLinkOption',
			onSelect: openEmbedLinkSettings,
		},
	};

	const options = [
		cannotEmbed && errorPickerOptions.retry,
		cannotEmbed && errorPickerOptions.convertToLink,
		cannotEmbed && errorPickerOptions.editLink,
	].filter( Boolean );

	function onPickerSelect( value ) {
		const selectedItem = options.find( ( item ) => item.value === value );
		selectedItem.onSelect();
	}

	// When the content cannot be embedded the onPress should trigger the Picker instead of the onPress prop.
	function resolveOnPressEvent() {
		if ( cannotEmbed ) {
			cannotEmbedMenuPickerRef.current?.presentPicker();
		} else {
			onPress();
		}
	}

	return (
		<>
			<View style={ containerStyle }>
				{ cannotEmbed ? (
					<>
						<Icon
							icon={ noticeOutline }
							fill={ embedIconErrorStyle.fill }
							style={ embedIconErrorStyle }
						/>
						<Text
							style={ [
								descriptionStyle,
								descriptionErrorStyle,
							] }
						>
							{ __( 'Unable to embed media' ) }
						</Text>
						<TouchableOpacity
							activeOpacity={ 0.5 }
							accessibilityRole="button"
							accessibilityHint={ __(
								'Double tap to view embed options.'
							) }
							style={ buttonStyles }
							hitSlop={ hitSlop }
							onPress={ resolveOnPressEvent }
							disabled={ ! isSelected }
						>
							<Text style={ actionStyle }>
								{ __( 'More options' ) }
							</Text>
						</TouchableOpacity>
						<Picker
							title={ __( 'Embed options' ) }
							ref={ cannotEmbedMenuPickerRef }
							options={ options }
							onChange={ onPickerSelect }
							hideCancelButton
							leftAlign
						/>
					</>
				) : (
					<>
						<View style={ styles[ 'embed__placeholder-header' ] }>
							<BlockIcon icon={ icon } fill={ iconStyles.fill } />
							<Text style={ labelStyle }>{ label }</Text>
						</View>
						<TouchableOpacity
							activeOpacity={ 0.5 }
							accessibilityRole="button"
							accessibilityHint={ __(
								'Double tap to add a link.'
							) }
							style={ buttonStyles }
							hitSlop={ hitSlop }
							onPress={ resolveOnPressEvent }
							disabled={ ! isSelected }
						>
							<Text style={ actionStyle }>
								{ __( 'Add link' ) }
							</Text>
						</TouchableOpacity>
					</>
				) }
			</View>
		</>
	);
};

export default EmbedPlaceholder;
