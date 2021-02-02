/**
 * External dependencies
 */
import { SafeAreaView, TouchableOpacity, View } from 'react-native';
import { lowerCase, startsWith } from 'lodash';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { BottomSheet, Icon } from '@wordpress/components';
import { getProtocol, prependHTTP } from '@wordpress/url';
import { link, cancelCircleFilled } from '@wordpress/icons';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import LinkPickerResults from './link-picker-results';
import NavigationHeader from '../bottom-sheet/navigation-header';
import styles from './styles.scss';

// this creates a search suggestion for adding a url directly
export const createDirectEntry = ( value ) => {
	let type = 'URL';

	const protocol = lowerCase( getProtocol( value ) ) || '';

	if ( protocol.includes( 'mailto' ) ) {
		type = 'mailto';
	}

	if ( protocol.includes( 'tel' ) ) {
		type = 'tel';
	}

	if ( startsWith( value, '#' ) ) {
		type = 'internal';
	}

	return {
		isDirectEntry: true,
		title: value,
		url: type === 'URL' ? prependHTTP( value ) : value,
		type,
	};
};

export const LinkPicker = ( {
	value: initialValue,
	onLinkPicked,
	onCancel: cancel,
} ) => {
	const [ value, setValue ] = useState( initialValue );
	const directEntry = createDirectEntry( value );

	// the title of a direct entry is displayed as the raw input value, but if we
	// are replacing empty text, we want to use the generated url
	const pickLink = ( { title, url, isDirectEntry } ) => {
		onLinkPicked( { title: isDirectEntry ? url : title, url } );
	};

	const onSubmit = () => {
		pickLink( directEntry );
	};

	const clear = () => {
		setValue( '' );
	};

	const omniCellStyle = usePreferredColorSchemeStyle(
		styles.omniCell,
		styles.omniCellDark
	);

	const iconStyle = usePreferredColorSchemeStyle(
		styles.icon,
		styles.iconDark
	);

	return (
		<SafeAreaView style={ styles.safeArea }>
			<NavigationHeader
				screen={ __( 'Link to' ) }
				leftButtonOnPress={ cancel }
				applyButtonOnPress={ onSubmit }
				isFullscreen
			/>
			<View style={ styles.contentContainer }>
				<BottomSheet.Cell
					icon={ link }
					style={ omniCellStyle }
					valueStyle={ styles.omniInput }
					value={ value }
					placeholder={ __( 'Search or type URL' ) }
					autoCapitalize="none"
					autoCorrect={ false }
					keyboardType="url"
					onChangeValue={ setValue }
					onSubmit={ onSubmit }
					/* eslint-disable-next-line jsx-a11y/no-autofocus */
					autoFocus
					separatorType="none"
				>
					{ value !== '' && (
						<TouchableOpacity
							onPress={ clear }
							style={ styles.clearIcon }
						>
							<Icon
								icon={ cancelCircleFilled }
								fill={ iconStyle.color }
								size={ 24 }
							/>
						</TouchableOpacity>
					) }
				</BottomSheet.Cell>
				{ !! value && (
					<LinkPickerResults
						query={ value }
						onLinkPicked={ pickLink }
						directEntry={ directEntry }
					/>
				) }
			</View>
		</SafeAreaView>
	);
};
