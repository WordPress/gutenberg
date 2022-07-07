/**
 * External dependencies
 */
import { View, Text, TouchableWithoutFeedback } from 'react-native';
import { compact } from 'lodash';

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
	const containerStyle = usePreferredColorSchemeStyle(
		styles.embed__container,
		styles[ 'embed__container--dark' ]
	);
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

	const options = compact( [
		cannotEmbed && errorPickerOptions.retry,
		cannotEmbed && errorPickerOptions.convertToLink,
		cannotEmbed && errorPickerOptions.editLink,
	] );

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
			<TouchableWithoutFeedback
				accessibilityRole={ 'button' }
				accessibilityHint={
					cannotEmbed
						? __( 'Double tap to view embed options.' )
						: __( 'Double tap to add a link.' )
				}
				onPress={ resolveOnPressEvent }
				disabled={ ! isSelected }
			>
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
							<Text style={ actionStyle }>
								{ __( 'More options' ) }
							</Text>
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
							<BlockIcon icon={ icon } />
							<Text style={ labelStyle }>{ label }</Text>
							<Text style={ actionStyle }>
								{ __( 'ADD LINK' ) }
							</Text>
						</>
					) }
				</View>
			</TouchableWithoutFeedback>
		</>
	);
};

export default EmbedPlaceholder;
