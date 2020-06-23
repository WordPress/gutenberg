/**
 * External dependencies
 */
import { Platform, Clipboard } from 'react-native';
/**
 * WordPress dependencies
 */
import { compose, usePrevious } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import { isURL, prependHTTP } from '@wordpress/url';
import { useEffect, useState } from '@wordpress/element';
import { link, external } from '@wordpress/icons';

/**
 * Internal dependencies
 */
/**
 * Internal dependencies
 */
import BottomSheet from '../bottom-sheet';
import PanelBody from '../../panel/body';
import TextControl from '../../text-control';
import ToggleControl from '../../toggle-control';
import UnsupportedFooterControl from '../../unsupported-footer-control';
import PanelActions from '../../panel/actions';
import LinkRelIcon from './link-rel';

import styles from './style.scss';

const NEW_TAB_REL = 'noreferrer noopener';

function LinkSettings( {
	isVisible,
	onClose,
	attributes,
	setAttributes,
	onEmptyURL,
	options,
	extractSettings,
	actions,
	editorSidebarOpened,
} ) {
	const { url, label, linkTarget, rel } = attributes;
	const [ urlInputValue, setUrlInputValue ] = useState( '' );
	const [ labelInputValue, setLabelInputValue ] = useState( '' );
	const [ linkRelInputValue, setLinkRelInputValue ] = useState( '' );
	const prevEditorSidebarOpened = usePrevious( editorSidebarOpened );

	useEffect( () => {
		setUrlInputValue( url || '' );
	}, [ url ] );

	useEffect( () => {
		setLabelInputValue( label || '' );
	}, [ label ] );

	useEffect( () => {
		setLinkRelInputValue( rel || '' );
	}, [ rel ] );

	useEffect( () => {
		const isSettingSheetOpen = isVisible || editorSidebarOpened;
		if ( options.url.autoFill && isSettingSheetOpen && ! url ) {
			getURLFromClipboard();
		}

		if ( prevEditorSidebarOpened && ! editorSidebarOpened ) {
			onSetAttributes();
		}
	}, [ editorSidebarOpened, isVisible ] );

	function onChangeURL( value ) {
		if ( ! value && onEmptyURL ) {
			onEmptyURL();
		}
		setUrlInputValue( value );
	}

	function onChangeLabel( value ) {
		setLabelInputValue( value );
	}

	function onSetAttributes() {
		setAttributes( {
			url: prependHTTP( urlInputValue ),
			label: labelInputValue,
			rel: linkRelInputValue,
		} );
	}

	function onCloseSettingsSheet() {
		onSetAttributes();
		onClose();
	}

	function onChangeOpenInNewTab( value ) {
		const newLinkTarget = value ? '_blank' : undefined;

		let updatedRel = rel;
		if ( newLinkTarget && ! rel ) {
			updatedRel = NEW_TAB_REL;
		} else if ( ! newLinkTarget && rel === NEW_TAB_REL ) {
			updatedRel = undefined;
		}

		setAttributes( {
			linkTarget: newLinkTarget,
			rel: updatedRel,
		} );
	}

	function onChangeLinkRel( value ) {
		setLinkRelInputValue( value );
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

	function getSettings() {
		return (
			<>
				{ options.url && (
					<TextControl
						icon={ options.url.showIcon && link }
						label={ options.url.label }
						value={ urlInputValue }
						valuePlaceholder={ options.url.placeholder }
						onChange={ onChangeURL }
						onSubmit={ onCloseSettingsSheet }
						autoCapitalize="none"
						autoCorrect={ false }
						// eslint-disable-next-line jsx-a11y/no-autofocus
						autoFocus={
							Platform.OS === 'ios' && options.url.autoFocus
						}
						keyboardType="url"
					/>
				) }
				{ options.linkLabel && (
					<TextControl
						label={ options.linkLabel.label }
						value={ labelInputValue }
						valuePlaceholder={ options.linkLabel.placeholder }
						onChange={ onChangeLabel }
					/>
				) }
				{ options.openInNewTab && (
					<ToggleControl
						icon={ options.openInNewTab.showIcon && external }
						label={ options.openInNewTab.label }
						checked={ linkTarget === '_blank' }
						onChange={ onChangeOpenInNewTab }
					/>
				) }
				{ options.linkRel && (
					<TextControl
						icon={ options.linkRel.showIcon && LinkRelIcon }
						label={ options.linkRel.label }
						value={ rel || '' }
						valuePlaceholder={ options.linkRel.placeholder }
						onChange={ onChangeLinkRel }
						onSubmit={ onCloseSettingsSheet }
						autoCapitalize="none"
						autoCorrect={ false }
						keyboardType="url"
					/>
				) }
			</>
		);
	}

	if ( extractSettings ) {
		return getSettings();
	}

	return (
		<BottomSheet
			isVisible={ isVisible }
			onClose={ onCloseSettingsSheet }
			hideHeader
		>
			<PanelBody style={ styles.linkSettingsPanel }>
				{ getSettings() }
			</PanelBody>
			{ options.footer && (
				<PanelBody style={ styles.linkSettingsPanel }>
					<UnsupportedFooterControl label={ options.footer.label } />
				</PanelBody>
			) }
			{ actions && <PanelActions actions={ actions } /> }
		</BottomSheet>
	);
}

export default compose( [
	withSelect( ( select ) => {
		const { isEditorSidebarOpened } = select( 'core/edit-post' );
		return {
			editorSidebarOpened: isEditorSidebarOpened(),
		};
	} ),
] )( LinkSettings );
