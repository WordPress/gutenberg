/**
 * External dependencies
 */
import { View, InteractionManager, AccessibilityInfo } from 'react-native';
/**
 * WordPress dependencies
 */
import {
	withInstanceId,
	compose,
} from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import {
	RichText,
	withColors,
	InspectorControls,
} from '@wordpress/block-editor';
import {
	TextControl,
	ToggleControl,
	PanelBody,
	RangeControl,
	MissingControl,
	NotificationSheet,
} from '@wordpress/components';
import {
	Component,
} from '@wordpress/element';
import { withDispatch, withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import richTextStyle from './richText.scss';
import styles from './editor.scss';
import RichTextWrapper from './richTextWrapper';

const NEW_TAB_REL = 'noreferrer noopener';
const MIN_BORDER_RADIUS_VALUE = 0;
const MAX_BORDER_RADIUS_VALUE = 50;
const INITIAL_MAX_WIDTH = 108;

class ButtonEdit extends Component {
	constructor( props ) {
		super( props );
		this.onChangeBackgroundColor = this.onChangeBackgroundColor.bind( this );
		this.setBorderRadius = this.setBorderRadius.bind( this );
		this.openNotificationSheet = this.openNotificationSheet.bind( this );
		this.toggleShowNoticationSheet = this.toggleShowNoticationSheet.bind( this );
		this.onLayout = this.onLayout.bind( this );
		this.setRichTextFocus = this.setRichTextFocus.bind( this );
		this.onToggleOpenInNewTab = this.onToggleOpenInNewTab.bind( this );

		this.state = {
			isFocused: false,
			showHelp: false,
			maxWidth: INITIAL_MAX_WIDTH,
		};
	}

	componentDidUpdate( prevProps ) {
		const { selectedId } = this.props;
		const { isFocused } = this.state;

		if ( this.richTextRef ) {
			const selectedRichText = this.richTextRef.props.id === selectedId;

			if ( selectedRichText && selectedId !== prevProps.selectedId && ! isFocused ) {
				AccessibilityInfo.isScreenReaderEnabled().then(
					( enabled ) => {
						if ( enabled ) {
							this.setRichTextFocus( true );
							return this.richTextRef.focus();
						}
					}
				);
			}
		}
	}

	onChangeBackgroundColor() {
		const { backgroundColor, attributes } = this.props;
		if ( backgroundColor.color ) {
			// `backgroundColor` which should be set when we are able to resolve it
			return backgroundColor.color;
		} else if ( attributes.backgroundColor ) {
			// `backgroundColor` which should be set when we can’t resolve
			// the button `backgroundColor` that was created on web
			return styles.fallbackButton.backgroundColor;
		// `backgroundColor` which should be set when `Button` is created on mobile
		} return styles.button.backgroundColor;
	}

	setBorderRadius( value ) {
		const { setAttributes } = this.props;
		setAttributes( {
			borderRadius: value,
		} );
	}

	toggleShowNoticationSheet() {
		this.setState( { showHelp: ! this.state.showHelp } );
	}

	openNotificationSheet() {
		const { closeGeneralSidebar } = this.props;
		closeGeneralSidebar();
		InteractionManager.runAfterInteractions( () => {
			this.toggleShowNoticationSheet();
		} );
	}

	onLayout( { nativeEvent } ) {
		const { width } = nativeEvent.layout;
		const { marginRight, paddingRight, borderWidth } = styles.button;
		const buttonSpacing = 2 * ( marginRight + paddingRight + borderWidth );
		this.setState( { maxWidth: width - buttonSpacing } );
	}

	setRichTextFocus( value ) {
		this.setState( { isFocused: value } );
	}

	onToggleOpenInNewTab( value ) {
		const { setAttributes, attributes } = this.props;
		const { rel } = attributes;

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

	render() {
		const { attributes, setAttributes, textColor, isSelected, clientId } = this.props;
		const {
			placeholder,
			text,
			borderRadius,
			url,
			linkTarget,
		} = attributes;
		const { isFocused, maxWidth, showHelp } = this.state;

		const borderRadiusValue = borderRadius !== undefined ? borderRadius : styles.button.borderRadius;
		const outlineBorderRadius = borderRadiusValue > 0 ? borderRadiusValue + styles.button.paddingTop + styles.button.borderWidth : 0;

		// To achieve proper expanding and shrinking `RichText` on iOS, there is a need to set a `minWidth`
		// value at least on 1 when `RichText` is focused or when is not focused, but `RichText` value is
		// different than empty string.
		const minWidth = isFocused || ( ! isFocused && text && text !== '' ) ? 1 : styles.button.minWidth;
		// To achieve proper expanding and shrinking `RichText` on Android, there is a need to set
		// a `placeholder` as an empty string when `RichText` is focused,
		// because `AztecView` is calculating a `minWidth` based on placeholder text.
		const placeholderText = isFocused ? '' : ( placeholder || __( 'Add text…' ) );

		return (
			<View
				style={ { flex: 1 } }
				onLayout={ this.onLayout }
			>
				<View
					style={ [
						styles.container,
						isSelected && {
							borderColor: this.onChangeBackgroundColor(),
							borderRadius: outlineBorderRadius,
							borderWidth: styles.button.borderWidth,
						},
					] }
				>
					<RichTextWrapper
						borderRadiusValue={ borderRadiusValue }
						backgroundColor={ this.onChangeBackgroundColor() }
					>
						<RichText
							setRef={ ( richText ) => {
								this.richTextRef = richText;
							} }
							placeholder={ placeholderText }
							value={ text }
							onChange={ ( value ) => setAttributes( { text: value } ) }
							style={ {
								...richTextStyle.richText,
								color: textColor.color || '#fff',
							} }
							textAlign="center"
							placeholderTextColor={ 'lightgray' }
							identifier="content"
							tagName="p"
							minWidth={ minWidth }
							maxWidth={ maxWidth }
							id={ clientId }
							unstableOnFocus={ () => this.setRichTextFocus( true ) }
							onBlur={ () => this.setRichTextFocus( false ) }
						/>
					</RichTextWrapper>

					<InspectorControls>
						<PanelBody title={ __( 'Border Settings' ) } >
							<RangeControl
								label={ __( 'Border Radius' ) }
								minimumValue={ MIN_BORDER_RADIUS_VALUE }
								maximumValue={ MAX_BORDER_RADIUS_VALUE }
								value={ borderRadiusValue }
								onChange={ this.setBorderRadius }
								separatorType="none"
							/>
						</PanelBody>
						<PanelBody title={ __( 'Link Settings' ) } >
							<ToggleControl
								label={ __( 'Open in new tab' ) }
								checked={ linkTarget === '_blank' }
								onChange={ this.onToggleOpenInNewTab }
								separatorType="fullWidth"
							/>
							<TextControl
								label={ __( 'Link Rel' ) }
								value={ url || '' }
								valuePlaceholder={ __( 'None' ) }
								onChange={ ( value ) => setAttributes( { url: value } ) }
								autoCapitalize="none"
								autoCorrect={ false }
								separatorType="none"
								keyboardType="url"
							/>
						</PanelBody>
						<PanelBody title={ __( 'Color Settings' ) } >
							<MissingControl
								label={ __( 'Coming Soon' ) }
								onChange={ this.openNotificationSheet }
								separatorType="none"
							/>
						</PanelBody>
					</InspectorControls>

					<NotificationSheet title="Color Settings" isVisible={ showHelp } onClose={ this.toggleShowNoticationSheet } type="plural" withMessage={ false } withQuotes={ false } />
				</View>
			</View>
		);
	}
}

export default compose( [
	withInstanceId,
	withColors( 'backgroundColor', { textColor: 'color' } ),
	withDispatch( ( dispatch ) => {
		const { closeGeneralSidebar } = dispatch( 'core/edit-post' );

		return {
			closeGeneralSidebar,
		};
	} ),
	withSelect( ( select ) => {
		const { getSelectedBlockClientId } = select( 'core/block-editor' );

		const selectedId = getSelectedBlockClientId();

		return {
			selectedId,
		};
	} ),
] )( ButtonEdit );
