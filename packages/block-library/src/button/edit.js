/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback, useRef } from '@wordpress/element';
import {
	Button,
	ButtonGroup,
	Dropdown,
	KeyboardShortcuts,
	PanelBody,
	TextControl,
	ToolbarButton,
} from '@wordpress/components';
import {
	BlockControls,
	InspectorControls,
	InspectorAdvancedControls,
	RichText,
	useBlockProps,
	__experimentalUseColorProps as useColorProps,
	__experimentalLinkControl as LinkControl,
} from '@wordpress/block-editor';
import { rawShortcut, displayShortcut } from '@wordpress/keycodes';
import { link, linkOff } from '@wordpress/icons';
import { createBlock } from '@wordpress/blocks';

const NEW_TAB_REL = 'noreferrer noopener';

function WidthPanel( { selectedWidth, setAttributes } ) {
	function handleChange( newWidth ) {
		// Check if we are toggling the width off
		const width = selectedWidth === newWidth ? undefined : newWidth;

		// Update attributes
		setAttributes( { width } );
	}

	return (
		<PanelBody title={ __( 'Width settings' ) }>
			<ButtonGroup aria-label={ __( 'Button width' ) }>
				{ [ 25, 50, 75, 100 ].map( ( widthValue ) => {
					return (
						<Button
							key={ widthValue }
							isSmall
							isPrimary={ widthValue === selectedWidth }
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

function URLPicker( {
	anchorRef,
	isSelected,
	onToggleOpenInNewTab,
	opensInNewTab,
	setAttributes,
	url,
} ) {
	const urlIsSet = !! url;
	const urlIsSetandSelected = urlIsSet && isSelected;
	const renderToggle = ( { isOpen, onToggle, onClose } ) => {
		const unlinkButton = () => {
			setAttributes( {
				url: undefined,
				linkTarget: undefined,
				rel: undefined,
			} );
			onClose();
		};
		return (
			<>
				{ ! urlIsSet && (
					<ToolbarButton
						aria-expanded={ isOpen }
						name="link"
						icon={ link }
						title={ __( 'Link' ) }
						shortcut={ displayShortcut.primary( 'k' ) }
						onClick={ onToggle }
					/>
				) }
				{ urlIsSetandSelected && (
					<ToolbarButton
						aria-expanded="true"
						name="link"
						icon={ linkOff }
						title={ __( 'Unlink' ) }
						shortcut={ displayShortcut.primaryShift( 'k' ) }
						onClick={ unlinkButton }
						isActive={ true }
					/>
				) }
				<KeyboardShortcuts
					bindGlobal
					shortcuts={ {
						[ rawShortcut.primary( 'k' ) ]: () => {
							onToggle();
							return false; // prevents default for event
						},
						[ rawShortcut.primaryShift( 'k' ) ]: unlinkButton,
					} }
				/>
			</>
		);
	};
	const renderContent = () => (
		<LinkControl
			className="wp-block-navigation-link__inline-link-input"
			value={ { url, opensInNewTab } }
			onChange={ ( {
				url: newURL = '',
				opensInNewTab: newOpensInNewTab,
			} ) => {
				setAttributes( { url: newURL } );

				if ( opensInNewTab !== newOpensInNewTab ) {
					onToggleOpenInNewTab( newOpensInNewTab );
				}
			} }
		/>
	);
	return (
		<Dropdown
			openOnMount={ urlIsSetandSelected }
			popoverProps={ { anchorRef: anchorRef?.current } }
			position="bottom center"
			renderContent={ renderContent }
			renderToggle={ renderToggle }
		/>
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
		linkTarget,
		placeholder,
		rel,
		style,
		text,
		url,
		width,
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

	const setButtonText = ( newText ) => {
		// Remove anchor tags from button text content.
		setAttributes( { text: newText.replace( /<\/?a[^>]*>/g, '' ) } );
	};

	const borderRadius = style?.border?.radius;
	const colorProps = useColorProps( attributes );
	const ref = useRef();
	const blockProps = useBlockProps( { ref } );

	return (
		<>
			<div
				{ ...blockProps }
				className={ classnames( blockProps.className, {
					[ `has-custom-width wp-block-button__width-${ width }` ]: width,
					[ `has-custom-font-size` ]: blockProps.style.fontSize,
				} ) }
			>
				<RichText
					aria-label={ __( 'Button text' ) }
					placeholder={ placeholder || __( 'Add text…' ) }
					value={ text }
					onChange={ ( value ) => setButtonText( value ) }
					withoutInteractiveFormatting
					className={ classnames(
						className,
						'wp-block-button__link',
						colorProps.className,
						{
							'no-border-radius': borderRadius === 0,
						}
					) }
					style={ {
						borderRadius: borderRadius
							? borderRadius + 'px'
							: undefined,
						...colorProps.style,
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
				<URLPicker
					anchorRef={ ref }
					isSelected={ isSelected }
					onToggleOpenInNewTab={ onToggleOpenInNewTab }
					opensInNewTab={ linkTarget === '_blank' }
					setAttributes={ setAttributes }
					url={ url }
				/>
			</BlockControls>
			<InspectorControls>
				<WidthPanel
					selectedWidth={ width }
					setAttributes={ setAttributes }
				/>
			</InspectorControls>
			<InspectorAdvancedControls>
				<TextControl
					label={ __( 'Link rel' ) }
					value={ rel || '' }
					onChange={ onSetLinkRel }
				/>
			</InspectorAdvancedControls>
		</>
	);
}

export default ButtonEdit;
