/**
 * External dependencies
 */
import classNames from 'classnames';

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
			onClose={ () => setPopover( false ) }
		>
			<form
				className="block-editor-url-popover__link-editor"
				onSubmit={ ( event ) => {
					event.preventDefault();
					setPopover( false );
				} }
			>
				<div className="block-editor-url-input">
					<URLInput
						__nextHasNoMarginBottom
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
	const { url, service, label, rel } = attributes;
	const {
		showLabels,
		iconColor,
		iconColorValue,
		iconBackgroundColor,
		iconBackgroundColorValue,
	} = context;
	const [ showURLPopover, setPopover ] = useState( false );
	const classes = classNames( 'wp-social-link', 'wp-social-link-' + service, {
		'wp-social-link__is-incomplete': ! url,
		[ `has-${ iconColor }-color` ]: iconColor,
		[ `has-${ iconBackgroundColor }-background-color` ]:
			iconBackgroundColor,
	} );

	// Use internal state instead of a ref to make sure that the component
	// re-renders when the popover's anchor updates.
	const [ popoverAnchor, setPopoverAnchor ] = useState( null );

	const IconComponent = getIconBySite( service );
	const socialLinkLabel = label ? label : getNameBySite( service );
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
							__nextHasNoMarginBottom
							label={ __( 'Link text' ) }
							help={ __(
								'The link text is only visible when Show links text is enabled.'
							) }
							value={ socialLinkLabel }
							onChange={ ( value ) =>
								setAttributes( { label: value } )
							}
						/>
					</PanelRow>
				</PanelBody>
			</InspectorControls>
			<InspectorControls group="advanced">
				<TextControl
					__nextHasNoMarginBottom
					label={ __( 'Link rel' ) }
					value={ rel || '' }
					onChange={ ( value ) => setAttributes( { rel: value } ) }
				/>
			</InspectorControls>
			<li { ...blockProps }>
				<Button
					className="wp-block-social-link-anchor"
					ref={ setPopoverAnchor }
					onClick={ () => setPopover( true ) }
				>
					<IconComponent />
					<span
						className={ classNames( 'wp-block-social-link-label', {
							'screen-reader-text': ! showLabels,
						} ) }
					>
						{ socialLinkLabel }
					</span>
				</Button>
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
