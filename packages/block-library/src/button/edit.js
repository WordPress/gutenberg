/**
 * External dependencies
 */
import classnames from 'classnames';
import { compact, partial } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	useCallback,
	useContext,
	useMemo,
	useState,
} from '@wordpress/element';
import {
	compose,
	withInstanceId,
} from '@wordpress/compose';
import {
	PanelBody,
	RangeControl,
	TextControl,
	ToggleControl,
	Toolbar,
	withFallbackStyles,
} from '@wordpress/components';
import {
	__experimentalUseGradient,
	BlockControls,
	ContrastChecker,
	InspectorControls,
	__experimentalPanelColorGradientSettings as PanelColorGradientSettings,
	RichText,
	URLInput,
	URLPopover,
	withColors,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { ButtonEditSettings } from './edit-settings';

const { getComputedStyle } = window;

const applyFallbackStyles = withFallbackStyles( ( node, ownProps ) => {
	const { textColor, backgroundColor } = ownProps;
	const backgroundColorValue = backgroundColor && backgroundColor.color;
	const textColorValue = textColor && textColor.color;
	//avoid the use of querySelector if textColor color is known and verify if node is available.
	const textNode = ! textColorValue && node ? node.querySelector( '[contenteditable="true"]' ) : null;
	return {
		fallbackBackgroundColor: backgroundColorValue || ! node ? undefined : getComputedStyle( node ).backgroundColor,
		fallbackTextColor: textColorValue || ! textNode ? undefined : getComputedStyle( textNode ).color,
	};
} );

const NEW_TAB_REL = 'noreferrer noopener';
const MIN_BORDER_RADIUS_VALUE = 0;
const MAX_BORDER_RADIUS_VALUE = 50;
const INITIAL_BORDER_RADIUS_POSITION = 5;

function BorderPanel( { borderRadius = '', setAttributes } ) {
	const setBorderRadius = useCallback(
		( newBorderRadius ) => {
			setAttributes( { borderRadius: newBorderRadius } );
		},
		[ setAttributes ]
	);
	return (
		<PanelBody title={ __( 'Border Settings' ) }>
			<RangeControl
				value={ borderRadius }
				label={ __( 'Border Radius' ) }
				min={ MIN_BORDER_RADIUS_VALUE }
				max={ MAX_BORDER_RADIUS_VALUE }
				initialPosition={ INITIAL_BORDER_RADIUS_POSITION }
				allowReset
				onChange={ setBorderRadius }
			/>
		</PanelBody>
	);
}

function ToolbarMovers( { clientId } ) {
	const {
		parentID,
		isFirst,
		isLast,
	} = useSelect(
		( select ) => {
			const {
				getBlockIndex,
				getBlockOrder,
				getBlockRootClientId,
			} = select( 'core/block-editor' );
			const rootClientId = getBlockRootClientId( clientId );
			const numberOfSiblings = getBlockOrder( rootClientId ).length;
			const buttonIndex = getBlockIndex( clientId, rootClientId );
			return {
				parentID: rootClientId,
				isFirst: buttonIndex === 0,
				isLast: buttonIndex === ( numberOfSiblings - 1 ),
			};
		},
		[ clientId ]
	);
	const { moveBlocksUp, moveBlocksDown } = useDispatch( 'core/block-editor' );
	const moveUp = useCallback(
		partial( moveBlocksUp, [ clientId ], parentID ),
		[ moveBlocksUp, clientId, parentID ]
	);
	const moveDown = useCallback(
		partial( moveBlocksDown, [ clientId ], parentID ),
		[ moveBlocksDown, clientId, parentID ]
	);
	const toolbarControls = useMemo(
		() => ( compact( [
			isFirst ? null : {
				icon: 'arrow-left-alt2',
				title: __( 'Move left' ),
				onClick: moveUp,
			},
			isLast ? null : {
				icon: 'arrow-right-alt2',
				title: __( 'Move right' ),
				onClick: moveDown,
			},
		] ) ),
		[ moveUp, moveDown, isFirst, isLast ]
	);

	return (
		<BlockControls>
			<Toolbar controls={ toolbarControls } />
		</BlockControls>
	);
}

const InlineURLPicker = withInstanceId(
	function( { instanceId, isSelected, url, onChange } ) {
		const linkId = `wp-block-button__inline-link-${ instanceId }`;
		return (
			<URLInput
				className="wp-block-button__inline-link-input"
				value={ url }
				/* eslint-disable jsx-a11y/no-autofocus */
				// Disable Reason: The rule is meant to prevent enabling auto-focus, not disabling it.
				autoFocus={ false }
				/* eslint-enable jsx-a11y/no-autofocus */
				onChange={ onChange }
				disableSuggestions={ ! isSelected }
				id={ linkId }
				isFullWidth
				hasBorder
			/>
		);
	}
);

function PopoverURLPicker( { url, onChange } ) {
	const [ urlInput, setUrlInput ] = useState( url || '' );
	const [ isPopoverEnable, setIsPopoverEnable ] = useState( true );
	const onSubmit = useCallback(
		() => {
			onChange( urlInput );
			setIsPopoverEnable( false );
		},
		[ urlInput, onChange ]
	);
	if ( ! isPopoverEnable ) {
		return null;
	}
	return (
		<URLPopover focusOnMount={ false }>
			<URLPopover.LinkEditor
				className="editor-format-toolbar__link-container-content block-editor-format-toolbar__link-container-content"
				value={ urlInput }
				onChangeInputValue={ setUrlInput }
				onSubmit={ onSubmit }
			/>
		</URLPopover>
	);
}

function URLPicker( { isSelected, url, setAttributes } ) {
	const onChange = useCallback(
		( value ) => setAttributes( { url: value } ),
		[ setAttributes ]
	);
	const { urlInPopover } = useContext( ButtonEditSettings );
	if ( urlInPopover ) {
		return isSelected ? (
			<PopoverURLPicker
				url={ url }
				onChange={ onChange }
			/>
		) : null;
	}
	return (
		<InlineURLPicker
			url={ url }
			isSelected={ isSelected }
			onChange={ onChange }
		/>
	);
}

function ButtonEdit( {
	attributes,
	backgroundColor,
	clientId,
	textColor,
	setBackgroundColor,
	setTextColor,
	fallbackBackgroundColor,
	fallbackTextColor,
	setAttributes,
	className,
	isSelected,
} ) {
	const {
		borderRadius,
		linkTarget,
		placeholder,
		rel,
		text,
		title,
		url,
	} = attributes;
	const onSetLinkRel = useCallback(
		( value ) => {
			setAttributes( { rel: value } );
		},
		[ setAttributes ]
	);

	const onToggleOpenInNewTab = useCallback(
		( value ) => {
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
		},
		[ rel, setAttributes ]
	);
	const {
		gradientClass,
		gradientValue,
		setGradient,
	} = __experimentalUseGradient();

	return (
		<div className={ className } title={ title }>
			<RichText
				placeholder={ placeholder || __( 'Add text…' ) }
				value={ text }
				onChange={ ( value ) => setAttributes( { text: value } ) }
				withoutInteractiveFormatting
				className={ classnames(
					'wp-block-button__link', {
						'has-background': backgroundColor.color || gradientValue,
						[ backgroundColor.class ]: ! gradientValue && backgroundColor.class,
						'has-text-color': textColor.color,
						[ textColor.class ]: textColor.class,
						[ gradientClass ]: gradientClass,
						'no-border-radius': borderRadius === 0,
					}
				) }
				style={ {
					...( ! backgroundColor.color && gradientValue ?
						{ background: gradientValue } :
						{ backgroundColor: backgroundColor.color }
					),
					color: textColor.color,
					borderRadius: borderRadius ? borderRadius + 'px' : undefined,
				} }
			/>
			<URLPicker
				url={ url }
				setAttributes={ setAttributes }
				isSelected={ isSelected }
			/>
			<InspectorControls>
				<PanelColorGradientSettings
					title={ __( 'Background & Text Color' ) }
					settings={ [
						{
							colorValue: textColor.color,
							onColorChange: setTextColor,
							label: __( 'Text Color' ),
						},
						{
							colorValue: backgroundColor.color,
							onColorChange: setBackgroundColor,
							gradientValue,
							onGradientChange: setGradient,
							label: __( 'Background' ),
						},
					] }
				>
					<ContrastChecker
						{ ...{
							// Text is considered large if font size is greater or equal to 18pt or 24px,
							// currently that's not the case for button.
							isLargeText: false,
							textColor: textColor.color,
							backgroundColor: backgroundColor.color,
							fallbackBackgroundColor,
							fallbackTextColor,
						} }
					/>
				</PanelColorGradientSettings>
				<BorderPanel
					borderRadius={ borderRadius }
					setAttributes={ setAttributes }
				/>
				<PanelBody title={ __( 'Link settings' ) }>
					<ToggleControl
						label={ __( 'Open in new tab' ) }
						onChange={ onToggleOpenInNewTab }
						checked={ linkTarget === '_blank' }
					/>
					<TextControl
						label={ __( 'Link rel' ) }
						value={ rel || '' }
						onChange={ onSetLinkRel }
					/>
				</PanelBody>
			</InspectorControls>
			<ToolbarMovers clientId={ clientId } />
		</div>
	);
}

export default compose( [
	withColors( 'backgroundColor', { textColor: 'color' } ),
	applyFallbackStyles,
] )( ButtonEdit );
