/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { DELETE, BACKSPACE } from '@wordpress/keycodes';
import { useDispatch } from '@wordpress/data';

import {
	InspectorControls,
	URLPopover,
	URLInput,
	useBlockProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useState } from '@wordpress/element';
import {
	Button,
	PanelBody,
	PanelRow,
	TextControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { keyboardReturn } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { getIconBySite, getNameBySite } from './social-list';

const SocialLinkURLPopover = ( {
	url,
	setAttributes,
	setPopover,
	popoverAnchor,
	clientId,
} ) => {
	const { removeBlock } = useDispatch( blockEditorStore );
	return (
		<URLPopover
			anchor={ popoverAnchor }
			aria-label={ __( 'Edit social link' ) }
			onClose={ () => {
				setPopover( false );
				popoverAnchor?.focus();
			} }
		>
			<form
				className="block-editor-url-popover__link-editor"
				onSubmit={ ( event ) => {
					event.preventDefault();
					setPopover( false );
					popoverAnchor?.focus();
				} }
			>
				<div className="block-editor-url-input">
					<URLInput
						value={ url }
						onChange={ ( nextURL ) =>
							setAttributes( { url: nextURL } )
						}
						placeholder={ __( 'Enter social link' ) }
						label={ __( 'Enter social link' ) }
						hideLabelFromVision
						disableSuggestions
						onKeyDown={ ( event ) => {
							if (
								!! url ||
								event.defaultPrevented ||
								! [ BACKSPACE, DELETE ].includes(
									event.keyCode
								)
							) {
								return;
							}
							removeBlock( clientId );
						} }
					/>
				</div>
				<Button
					icon={ keyboardReturn }
					label={ __( 'Apply' ) }
					type="submit"
				/>
			</form>
		</URLPopover>
	);
};

const SocialLinkEdit = ( {
	attributes,
	context,
	isSelected,
	setAttributes,
	clientId,
} ) => {
	const { url, service, label = '', rel } = attributes;
	const {
		showLabels,
		iconColor,
		iconColorValue,
		iconBackgroundColor,
		iconBackgroundColorValue,
	} = context;
	const [ showURLPopover, setPopover ] = useState( false );
	const classes = clsx( 'wp-social-link', 'wp-social-link-' + service, {
		'wp-social-link__is-incomplete': ! url,
		[ `has-${ iconColor }-color` ]: iconColor,
		[ `has-${ iconBackgroundColor }-background-color` ]:
			iconBackgroundColor,
	} );

	// Use internal state instead of a ref to make sure that the component
	// re-renders when the popover's anchor updates.
	const [ popoverAnchor, setPopoverAnchor ] = useState( null );

	const IconComponent = getIconBySite( service );
	const socialLinkName = getNameBySite( service );
	// The initial label (ie. the link text) is an empty string.
	// We want to prevent empty links so that the link text always fallbacks to
	// the social name, even when users enter and save an empty string or only
	// spaces. The PHP render callback fallbacks to the social name as well.
	const socialLinkText = label.trim() === '' ? socialLinkName : label;

	const blockProps = useBlockProps( {
		className: classes,
		style: {
			color: iconColorValue,
			backgroundColor: iconBackgroundColorValue,
		},
	} );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Settings' ) }>
					<PanelRow>
						<TextControl
							// TODO: Switch to `true` (40px size) if possible
							__next40pxDefaultSize={ false }
							__nextHasNoMarginBottom
							label={ __( 'Text' ) }
							help={ __(
								'The text is visible when enabled from the parent Social Icons block.'
							) }
							value={ label }
							onChange={ ( value ) =>
								setAttributes( { label: value } )
							}
							placeholder={ socialLinkName }
						/>
					</PanelRow>
				</PanelBody>
			</InspectorControls>
			<InspectorControls group="advanced">
				<TextControl
					// TODO: Switch to `true` (40px size) if possible
					__next40pxDefaultSize={ false }
					__nextHasNoMarginBottom
					label={ __( 'Link rel' ) }
					value={ rel || '' }
					onChange={ ( value ) => setAttributes( { rel: value } ) }
				/>
			</InspectorControls>
			<li { ...blockProps }>
				<button
					className="wp-block-social-link-anchor"
					ref={ setPopoverAnchor }
					onClick={ () => setPopover( true ) }
					aria-haspopup="dialog"
				>
					<IconComponent />
					<span
						className={ clsx( 'wp-block-social-link-label', {
							'screen-reader-text': ! showLabels,
						} ) }
					>
						{ socialLinkText }
					</span>
				</button>
				{ isSelected && showURLPopover && (
					<SocialLinkURLPopover
						url={ url }
						setAttributes={ setAttributes }
						setPopover={ setPopover }
						popoverAnchor={ popoverAnchor }
						clientId={ clientId }
					/>
				) }
			</li>
		</>
	);
};

export default SocialLinkEdit;
