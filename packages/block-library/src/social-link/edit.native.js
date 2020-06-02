/**
 * External dependencies
 */
import { View, Platform } from 'react-native';

/**
 * WordPress dependencies
 */
import { InspectorControls, BlockControls } from '@wordpress/block-editor';
import { useEffect, useState } from '@wordpress/element';
import {
	PanelBody,
	TextControl,
	ToolbarGroup,
	BottomSheet,
	ToolbarButton,
} from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';
import { link } from '@wordpress/icons';
import { prependHTTP } from '@wordpress/url';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { getIconBySite, getNameBySite } from './social-list';

const SocialLinkEdit = ( {
	attributes,
	setAttributes,
	isSelected,
	editorSidebarOpened,
} ) => {
	const { url, service } = attributes;
	const [ isLinkSheetVisible, setIsLinkSheetVisible ] = useState( false );

	const IconComponent = getIconBySite( service );
	const socialLinkName = getNameBySite( service );

	useEffect( () => {
		setAttributes( { url: prependHTTP( url ) } );
	}, [ ! isLinkSheetVisible && ! editorSidebarOpened && url ] );

	function onChangeURL( value ) {
		setAttributes( { url: value } );
	}

	function getLinkSettings( isCompatibleWithSettings = true ) {
		return (
			<PanelBody
				title={ isCompatibleWithSettings && __( 'Link Settings' ) }
			>
				<TextControl
					icon={ link }
					label={ sprintf(
						// translators: %s: social link name e.g: "Instagram".
						__( 'Add %s link' ),
						socialLinkName
					) }
					value={ url || '' }
					valuePlaceholder={ __( 'Add URL' ) }
					onChange={ onChangeURL }
					onSubmit={ () => setIsLinkSheetVisible( false ) }
					autoCapitalize="none"
					autoCorrect={ false }
					// eslint-disable-next-line jsx-a11y/no-autofocus
					autoFocus={
						! isCompatibleWithSettings && Platform.OS === 'ios'
					}
					keyboardType="url"
				/>
			</PanelBody>
		);
	}

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
			<InspectorControls>{ getLinkSettings() }</InspectorControls>
			<IconComponent />
		</View>
	);
};

export default compose( [
	withSelect( ( select ) => {
		const { isEditorSidebarOpened } = select( 'core/edit-post' );

		return {
			editorSidebarOpened: isEditorSidebarOpened(),
		};
	} ),
] )( SocialLinkEdit );
