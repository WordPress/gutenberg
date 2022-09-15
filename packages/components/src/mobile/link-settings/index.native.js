/**
 * External dependencies
 */
import { Platform } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import { isURL, prependHTTP } from '@wordpress/url';
import {
	useEffect,
	useState,
	useRef,
	useContext,
	useCallback,
} from '@wordpress/element';
import { link, external } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import BottomSheet from '../bottom-sheet';
import { BottomSheetContext } from '../bottom-sheet/bottom-sheet-context';
import PanelBody from '../../panel/body';
import TextControl from '../../text-control';
import ToggleControl from '../../toggle-control';
import FooterMessageControl from '../../footer-message-control';
import PanelActions from '../../panel/actions';
import LinkRelIcon from './link-rel';

import styles from './style.scss';

const NEW_TAB_REL = 'noreferrer noopener';
function LinkSettings( {
	// Control link settings `BottomSheet` visibility
	isVisible,
	// Callback that is called on closing bottom sheet
	onClose,
	// Function called to set attributes
	setAttributes,
	// Callback that is called when url input field is empty
	onEmptyURL,
	// Object of available options along with specific, customizable properties.
	// Available options keys:
	//	* url - uses `TextControl` component to set `attributes.url`
	//	* linkLabel - uses `TextControl` component to set `attributes.label`
	//	* openInNewTab - uses `ToggleControl` component to set `attributes.linkTarget` and `attributes.rel`
	//	* linkRel - uses `TextControl` component to set `attributes.rel`
	//	* footer - uses `FooterMessageControl` component to display message, e.g. about missing functionality
	// Available properties:
	//	* label - control component label, e.g. `Button Link URL`
	//	* placeholder - control component placeholder, e.g. `Add URL`
	//	* autoFocus (url only) - whether url input should be focused on sheet opening
	//	* autoFill (url only) - whether url input should be filled with url from clipboard
	// Example:
	//	const options = {
	//		url: {
	//			label: __( 'Button Link URL' ),
	//			placeholder: __( 'Add URL' ),
	//			autoFocus: true,
	//			autoFill: true,
	//		}
	//	}
	options,
	// Specifies whether settings should be wrapped into `BottomSheet`
	withBottomSheet,
	// Defines buttons which will be displayed below the all options.
	// It's an array of objects with following properties:
	//	* label - button title
	//	* onPress - callback that is called on pressing button
	// Example:
	// 	const actions = [
	//		{
	//			label: __( 'Remove link' ),
	//			onPress: () => setAttributes({ url: '' }),
	//		},
	//	];
	actions,
	// Specifies whether general `BottomSheet` is opened
	editorSidebarOpened,
	// Specifies whether icon should be displayed next to the label
	showIcon,
	onLinkCellPressed,
	urlValue,
	// Attributes properties
	url,
	label = '',
	linkTarget,
	rel = '',
} ) {
	const [ urlInputValue, setUrlInputValue ] = useState( '' );
	const [ labelInputValue, setLabelInputValue ] = useState( '' );
	const [ linkRelInputValue, setLinkRelInputValue ] = useState( '' );
	const onCloseSettingsSheetConsumed = useRef( false );
	const prevEditorSidebarOpenedRef = useRef();

	const { onHandleClosingBottomSheet } = useContext( BottomSheetContext );
	useEffect( () => {
		if ( onHandleClosingBottomSheet ) {
			onHandleClosingBottomSheet( onCloseSettingsSheet );
		}
	}, [ urlInputValue, labelInputValue, linkRelInputValue ] );

	useEffect( () => {
		prevEditorSidebarOpenedRef.current = editorSidebarOpened;
	} );
	const prevEditorSidebarOpened = prevEditorSidebarOpenedRef.current;

	useEffect( () => {
		if ( url !== urlInputValue ) {
			setUrlInputValue( url || '' );
		}
	}, [ url ] );

	useEffect( () => {
		setLabelInputValue( label || '' );
	}, [ label ] );

	useEffect( () => {
		setLinkRelInputValue( rel || '' );
	}, [ rel ] );

	useEffect( () => {
		const isSettingSheetOpen = isVisible || editorSidebarOpened;
		if ( isSettingSheetOpen ) {
			onCloseSettingsSheetConsumed.current = false;
		}

		if ( options.url.autoFill && isSettingSheetOpen && ! url ) {
			getURLFromClipboard();
		}

		if ( prevEditorSidebarOpened && ! editorSidebarOpened ) {
			onSetAttributes();
		}
	}, [ editorSidebarOpened, isVisible ] );

	useEffect( () => {
		if ( ! urlValue && onEmptyURL ) {
			onEmptyURL();
		}

		if ( prependHTTP( urlValue ) !== url ) {
			setAttributes( {
				url: prependHTTP( urlValue ),
			} );
		}
	}, [ urlValue ] );

	const onChangeURL = useCallback(
		( value ) => {
			if ( ! value && onEmptyURL ) {
				onEmptyURL();
			}
			setUrlInputValue( value );
		},
		[ onEmptyURL ]
	);

	const onChangeLabel = useCallback( ( value ) => {
		setLabelInputValue( value );
	}, [] );

	const onSetAttributes = useCallback( () => {
		const newURL = prependHTTP( urlInputValue );
		if (
			url !== newURL ||
			labelInputValue !== label ||
			linkRelInputValue !== rel
		) {
			setAttributes( {
				url: newURL,
				label: labelInputValue,
				rel: linkRelInputValue,
			} );
		}
	}, [ urlInputValue, labelInputValue, linkRelInputValue, setAttributes ] );

	const onCloseSettingsSheet = useCallback( () => {
		if ( onCloseSettingsSheetConsumed.current ) {
			return;
		}

		onCloseSettingsSheetConsumed.current = true;

		onSetAttributes();

		if ( onClose ) {
			onClose();
		}
	}, [ onClose, onSetAttributes ] );

	const onChangeOpenInNewTab = useCallback(
		( value ) => {
			const newLinkTarget = value ? '_blank' : undefined;

			let updatedRel = linkRelInputValue;
			if ( newLinkTarget && ! linkRelInputValue ) {
				updatedRel = NEW_TAB_REL;
			} else if ( ! newLinkTarget && linkRelInputValue === NEW_TAB_REL ) {
				updatedRel = undefined;
			}

			setAttributes( {
				linkTarget: newLinkTarget,
				rel: updatedRel,
			} );
		},
		[ linkRelInputValue ]
	);

	const onChangeLinkRel = useCallback( ( value ) => {
		setLinkRelInputValue( value );
	}, [] );

	async function getURLFromClipboard() {
		const clipboardText = await Clipboard.getString();

		if ( ! clipboardText ) {
			return;
		}
		// Check if pasted text is URL.
		if ( ! isURL( clipboardText ) ) {
			return;
		}

		setAttributes( { url: clipboardText } );
	}

	function getSettings() {
		return (
			<>
				{ options.url &&
					( onLinkCellPressed ? (
						<BottomSheet.LinkCell
							showIcon={ showIcon }
							value={ url }
							valueMask={ options.url.valueMask }
							onPress={ onLinkCellPressed }
						/>
					) : (
						<TextControl
							icon={ showIcon && link }
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
					) ) }
				{ options.linkLabel && (
					<TextControl
						label={ options.linkLabel.label }
						value={ labelInputValue }
						valuePlaceholder={ options.linkLabel.placeholder }
						onChange={ onChangeLabel }
					/>
				) }
				{ !! urlInputValue && (
					<>
						{ options.openInNewTab && (
							<ToggleControl
								icon={ showIcon && external }
								label={ options.openInNewTab.label }
								checked={ linkTarget === '_blank' }
								onChange={ onChangeOpenInNewTab }
							/>
						) }
						{ options.linkRel && (
							<TextControl
								icon={ showIcon && LinkRelIcon }
								label={ options.linkRel.label }
								value={ linkRelInputValue }
								valuePlaceholder={ options.linkRel.placeholder }
								onChange={ onChangeLinkRel }
								onSubmit={ onCloseSettingsSheet }
								autoCapitalize="none"
								autoCorrect={ false }
								keyboardType="default"
							/>
						) }
					</>
				) }
			</>
		);
	}

	if ( ! withBottomSheet ) {
		return getSettings();
	}

	return (
		<>
			<PanelBody style={ styles.linkSettingsPanel }>
				{ getSettings() }
			</PanelBody>
			{ options.footer && (
				<PanelBody style={ styles.linkSettingsPanel }>
					<FooterMessageControl
						label={ options.footer.label }
						separatorType={ options.footer.separatorType }
					/>
				</PanelBody>
			) }
			{ actions && <PanelActions actions={ actions } /> }
		</>
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
