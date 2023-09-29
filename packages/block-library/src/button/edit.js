/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import { NEW_TAB_TARGET, NOFOLLOW_REL, NEW_TAB_REL } from './constants';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState, useRef } from '@wordpress/element';
import {
	Button,
	ButtonGroup,
	PanelBody,
	TextControl,
	ToolbarButton,
	Popover,
} from '@wordpress/components';
import {
	AlignmentControl,
	BlockControls,
	InspectorControls,
	RichText,
	useBlockProps,
	__experimentalUseBorderProps as useBorderProps,
	__experimentalUseColorProps as useColorProps,
	__experimentalGetSpacingClassesAndStyles as useSpacingProps,
	__experimentalLinkControl as LinkControl,
	buildLinkValueFromData,
	buildDataFromLinkValue,
	__experimentalGetElementClassName,
} from '@wordpress/block-editor';
import { displayShortcut, isKeyboardEvent } from '@wordpress/keycodes';
import { link, linkOff } from '@wordpress/icons';
import { createBlock } from '@wordpress/blocks';
import { useMergeRefs } from '@wordpress/compose';

const LINK_SETTINGS = [
	...LinkControl.DEFAULT_LINK_SETTINGS,
	{
		id: 'nofollow',
		title: __( 'Mark as nofollow' ),
	},
];

function WidthPanel( { selectedWidth, setAttributes } ) {
	function handleChange( newWidth ) {
		// Check if we are toggling the width off
		const width = selectedWidth === newWidth ? undefined : newWidth;

		// Update attributes.
		setAttributes( { width } );
	}

	return (
		<PanelBody title={ __( 'Width settings' ) }>
			<ButtonGroup aria-label={ __( 'Button width' ) }>
				{ [ 25, 50, 75, 100 ].map( ( widthValue ) => {
					return (
						<Button
							key={ widthValue }
							size="small"
							variant={
								widthValue === selectedWidth
									? 'primary'
									: undefined
							}
							onClick={ () => handleChange( widthValue ) }
						>
							{ widthValue }%
						</Button>
					);
				} ) }
			</ButtonGroup>
		</PanelBody>
	);
}

function ButtonEdit( props ) {
	const {
		attributes,
		setAttributes,
		className,
		isSelected,
		onReplace,
		mergeBlocks,
	} = props;
	const {
		tagName,
		textAlign,
		linkTarget,
		placeholder,
		rel,
		style,
		text,
		url,
		width,
	} = attributes;

	const TagName = tagName || 'a';

	function setButtonText( newText ) {
		// Remove anchor tags from button text content.
		setAttributes( { text: newText.replace( /<\/?a[^>]*>/g, '' ) } );
	}

	function onKeyDown( event ) {
		if ( isKeyboardEvent.primary( event, 'k' ) ) {
			startEditing( event );
		} else if ( isKeyboardEvent.primaryShift( event, 'k' ) ) {
			unlink();
			richTextRef.current?.focus();
		}
	}

	// Use internal state instead of a ref to make sure that the component
	// re-renders when the popover's anchor updates.
	const [ popoverAnchor, setPopoverAnchor ] = useState( null );

	const borderProps = useBorderProps( attributes );
	const colorProps = useColorProps( attributes );
	const spacingProps = useSpacingProps( attributes );
	const ref = useRef();
	const richTextRef = useRef();
	const blockProps = useBlockProps( {
		ref: useMergeRefs( [ setPopoverAnchor, ref ] ),
		onKeyDown,
	} );

	const [ isEditingURL, setIsEditingURL ] = useState( false );
	const isURLSet = !! url;

	const isLinkTag = 'a' === TagName;

	// Defines how block attributes map to link value and vice versa.
	const linkValueAttrsToDataMapping = {
		url: 'url',
		opensInNewTab: {
			dataKey: 'linkTarget',
			toLink: ( value ) => value === NEW_TAB_TARGET,
			toData: ( value ) => ( value ? NEW_TAB_TARGET : undefined ),
		},
		nofollow: {
			dataKey: 'rel',
			toLink: ( value ) => value?.includes( NOFOLLOW_REL ),
			toData: ( value, { opensInNewTab: opensInNewTabValue } ) => {
				// "rel" attribute can be effected by changes to
				// "nofollow" and "opensInNewTab" attributes.
				// In addition it is editable in plaintext via the UI
				// so consider that it may already contain a value.
				let updatedRel = '';

				// Handle setting rel based on nofollow setting.
				if ( value ) {
					updatedRel = updatedRel?.includes( NOFOLLOW_REL )
						? updatedRel
						: updatedRel + ` ${ NOFOLLOW_REL }`;
				} else {
					const relRegex = new RegExp(
						`\\b${ NOFOLLOW_REL }\\s*`,
						'g'
					);
					updatedRel = updatedRel?.replace( relRegex, '' ).trim();
				}

				// Handle setting rel based on opensInNewTab setting.
				if ( opensInNewTabValue ) {
					updatedRel = updatedRel?.includes( NEW_TAB_REL )
						? updatedRel
						: updatedRel + ` ${ NEW_TAB_REL }`;
				} else {
					const relRegex = new RegExp(
						`\\b${ NEW_TAB_REL }\\s*`,
						'g'
					);
					updatedRel = updatedRel?.replace( relRegex, '' ).trim();
				}

				// Returning `undefined` here if there is no String-based rel value.
				// ensures that the attribute is fully removed from the block.
				return updatedRel || undefined;
			},
		},
	};

	function startEditing( event ) {
		event.preventDefault();
		setIsEditingURL( true );
	}

	function unlink() {
		setAttributes( {
			url: undefined,
			linkTarget: undefined,
			rel: undefined,
		} );
		setIsEditingURL( false );
	}

	useEffect( () => {
		if ( ! isSelected ) {
			setIsEditingURL( false );
		}
	}, [ isSelected ] );

	// NOT NOT MERGE WITHOUT RE-INTSTAINTG THIS MEMOIZATION
	// Memoize link value to avoid overriding the LinkControl's internal state.
	// This is a temporary fix. See https://github.com/WordPress/gutenberg/issues/51256.
	const linkValue = buildLinkValueFromData(
		{
			url,
			linkTarget,
			rel,
		},
		linkValueAttrsToDataMapping
	);
	// NOT NOT MERGE WITHOUT RE-INTSTAINTG THIS MEMOIZATION

	return (
		<>
			<div
				{ ...blockProps }
				className={ classnames( blockProps.className, {
					[ `has-custom-width wp-block-button__width-${ width }` ]:
						width,
					[ `has-custom-font-size` ]: blockProps.style.fontSize,
				} ) }
			>
				<RichText
					ref={ richTextRef }
					aria-label={ __( 'Button text' ) }
					placeholder={ placeholder || __( 'Add text…' ) }
					value={ text }
					onChange={ ( value ) => setButtonText( value ) }
					withoutInteractiveFormatting
					className={ classnames(
						className,
						'wp-block-button__link',
						colorProps.className,
						borderProps.className,
						{
							[ `has-text-align-${ textAlign }` ]: textAlign,
							// For backwards compatibility add style that isn't
							// provided via block support.
							'no-border-radius': style?.border?.radius === 0,
						},
						__experimentalGetElementClassName( 'button' )
					) }
					style={ {
						...borderProps.style,
						...colorProps.style,
						...spacingProps.style,
					} }
					onSplit={ ( value ) =>
						createBlock( 'core/button', {
							...attributes,
							text: value,
						} )
					}
					onReplace={ onReplace }
					onMerge={ mergeBlocks }
					identifier="text"
				/>
			</div>
			<BlockControls group="block">
				<AlignmentControl
					value={ textAlign }
					onChange={ ( nextAlign ) => {
						setAttributes( { textAlign: nextAlign } );
					} }
				/>
				{ ! isURLSet && isLinkTag && (
					<ToolbarButton
						name="link"
						icon={ link }
						title={ __( 'Link' ) }
						shortcut={ displayShortcut.primary( 'k' ) }
						onClick={ startEditing }
					/>
				) }
				{ isURLSet && isLinkTag && (
					<ToolbarButton
						name="link"
						icon={ linkOff }
						title={ __( 'Unlink' ) }
						shortcut={ displayShortcut.primaryShift( 'k' ) }
						onClick={ unlink }
						isActive={ true }
					/>
				) }
			</BlockControls>
			{ isLinkTag && isSelected && ( isEditingURL || isURLSet ) && (
				<Popover
					placement="bottom"
					onClose={ () => {
						setIsEditingURL( false );
						richTextRef.current?.focus();
					} }
					anchor={ popoverAnchor }
					focusOnMount={ isEditingURL ? 'firstElement' : false }
					__unstableSlotName={ '__unstable-block-tools-after' }
					shift
				>
					<LinkControl
						value={ linkValue }
						onChange={ ( newLinkValue ) =>
							setAttributes(
								buildDataFromLinkValue(
									newLinkValue,
									linkValueAttrsToDataMapping
								)
							)
						}
						onRemove={ () => {
							unlink();
							richTextRef.current?.focus();
						} }
						forceIsEditingLink={ isEditingURL }
						settings={ LINK_SETTINGS }
					/>
				</Popover>
			) }
			<InspectorControls>
				<WidthPanel
					selectedWidth={ width }
					setAttributes={ setAttributes }
				/>
			</InspectorControls>
			<InspectorControls group="advanced">
				{ isLinkTag && (
					<TextControl
						__nextHasNoMarginBottom
						label={ __( 'Link rel' ) }
						value={ rel || '' }
						onChange={ ( newRel ) =>
							setAttributes( { rel: newRel } )
						}
					/>
				) }
			</InspectorControls>
		</>
	);
}

export default ButtonEdit;
