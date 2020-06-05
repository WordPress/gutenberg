/**
 * External dependencies
 */
import { View, Platform, Clipboard } from 'react-native';

/**
 * WordPress dependencies
 */
import { BlockControls } from '@wordpress/block-editor';
import { useEffect, useState } from '@wordpress/element';
import {
	PanelBody,
	TextControl,
	ToolbarGroup,
	BottomSheet,
	ToolbarButton,
	UnsupportedFooterControl,
} from '@wordpress/components';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';
import { link, Icon } from '@wordpress/icons';
import { prependHTTP, isURL } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { getIconBySite, getNameBySite } from './social-list';
import styles from './editor.scss';

const SocialLinkEdit = ( { attributes, setAttributes, isSelected } ) => {
	const { url, service, label } = attributes;

	const [ isLinkSheetVisible, setIsLinkSheetVisible ] = useState( false );

	const IconComponent = getIconBySite( service )();
	const socialLinkName = getNameBySite( service );

	useEffect( () => {
		setAttributes( { url: prependHTTP( url ) } );
	}, [ ! isLinkSheetVisible && url ] );

	useEffect( () => {
		if ( ! url && isLinkSheetVisible ) {
			getURLFromClipboard();
		}
	}, [ isLinkSheetVisible ] );

	function onChangeURL( value ) {
		setAttributes( { url: value } );
	}

	function onChangeLabel( value ) {
		setAttributes( { label: value } );
	}

	async function getURLFromClipboard() {
		const clipboardText = await Clipboard.getString();

		if ( ! clipboardText ) {
			return;
		}
		// Check if pasted text is URL
		if ( ! isURL( clipboardText ) ) {
			return;
		}

		setAttributes( { url: clipboardText } );
	}

	function getLinkSettings( isCompatibleWithSettings = true ) {
		return (
			<>
				<PanelBody
					title={
						isCompatibleWithSettings &&
						sprintf(
							/* translators: %s: name of the social service. */
							__( '%s label' ),
							socialLinkName
						)
					}
					style={
						! isCompatibleWithSettings && styles.linkSettingsPanel
					}
				>
					<TextControl
						label={ __( 'URL' ) }
						value={ url || '' }
						valuePlaceholder={ __( 'Add URL' ) }
						onChange={ onChangeURL }
						onSubmit={ () => setIsLinkSheetVisible( false ) }
						autoCapitalize="none"
						autoCorrect={ false }
						// eslint-disable-next-line jsx-a11y/no-autofocus
						autoFocus={ Platform.OS === 'ios' }
						keyboardType="url"
					/>
					<TextControl
						label={ __( 'Link label' ) }
						value={ label || '' }
						valuePlaceholder={ __( 'None' ) }
						onChange={ onChangeLabel }
					/>
				</PanelBody>
				<PanelBody
					style={
						! isCompatibleWithSettings && styles.linkSettingsPanel
					}
				>
					<UnsupportedFooterControl
						label={ __(
							'Briefly describe the link to help screen reader user'
						) }
					></UnsupportedFooterControl>
				</PanelBody>
			</>
		);
	}

	const activeIcon =
		styles[ `wp-social-link-${ service }` ] || styles[ `wp-social-link` ];
	const inactiveIcon = usePreferredColorSchemeStyle(
		styles.inactiveIcon,
		styles.inactiveIconDark
	);
	const { backgroundColor, color, stroke } = url ? activeIcon : inactiveIcon;

	return (
		<View>
			{ isSelected && (
				<BlockControls>
					<ToolbarGroup>
						<ToolbarButton
							title={ sprintf(
								// translators: %s: social link name e.g: "Instagram".
								__( 'Add link to %s' ),
								socialLinkName
							) }
							icon={ link }
							onClick={ () => setIsLinkSheetVisible( true ) }
							isActive={ url }
						/>
					</ToolbarGroup>
				</BlockControls>
			) }
			<BottomSheet
				isVisible={ isLinkSheetVisible }
				onClose={ () => setIsLinkSheetVisible( false ) }
				hideHeader
			>
				{ getLinkSettings( false ) }
			</BottomSheet>
			<View style={ [ styles.iconContainer, { backgroundColor } ] }>
				<Icon icon={ IconComponent } style={ { stroke, color } } />
			</View>
		</View>
	);
};

export default SocialLinkEdit;
