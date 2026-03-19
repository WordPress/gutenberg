/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	InspectorControls,
	RichText,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	Button,
	CheckboxControl,
	TextControl,
	TextareaControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { external } from '@wordpress/icons';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

const preventDefault = ( event ) => event.preventDefault();

export default function HomeEdit( { attributes, setAttributes, context } ) {
	const homeUrl = useSelect( ( select ) => {
		// Site index.
		return select( coreStore ).getEntityRecord( 'root', '__unstableBase' )
			?.home;
	}, [] );

	const { textColor, backgroundColor, style } = context;
	const { label, opensInNewTab, description, rel } = attributes;
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	const blockProps = useBlockProps( {
		className: clsx( 'wp-block-navigation-item', {
			'has-text-color': !! textColor || !! style?.color?.text,
			[ `has-${ textColor }-color` ]: !! textColor,
			'has-background': !! backgroundColor || !! style?.color?.background,
			[ `has-${ backgroundColor }-background-color` ]: !! backgroundColor,
		} ),
		style: {
			color: style?.color?.text,
			backgroundColor: style?.color?.background,
		},
	} );

	return (
		<>
			<InspectorControls group="content">
				<ToolsPanel
					label={ __( 'Settings' ) }
					resetAll={ () => {
						setAttributes( {
							label: '',
							opensInNewTab: false,
							description: '',
							rel: '',
						} );
					} }
					dropdownMenuProps={ dropdownMenuProps }
				>
					<ToolsPanelItem
						hasValue={ () => !! label }
						label={ __( 'Text' ) }
						onDeselect={ () => setAttributes( { label: '' } ) }
						isShownByDefault
					>
						<TextControl
							__next40pxDefaultSize
							label={ __( 'Text' ) }
							value={ label ? stripHTML( label ) : '' }
							onChange={ ( labelValue ) => {
								setAttributes( { label: labelValue } );
							} }
							autoComplete="off"
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						hasValue={ () => !! opensInNewTab }
						label={ __( 'Open in new tab' ) }
						onDeselect={ () =>
							setAttributes( { opensInNewTab: false } )
						}
						isShownByDefault
					>
						<CheckboxControl
							label={ __( 'Open in new tab' ) }
							checked={ opensInNewTab }
							onChange={ ( value ) =>
								setAttributes( { opensInNewTab: value } )
							}
						/>
					</ToolsPanelItem>
					{ homeUrl && (
						<Button
							variant="secondary"
							href={ homeUrl }
							target="_blank"
							icon={ external }
							iconPosition="right"
							__next40pxDefaultSize
							className="navigation-link-to__action-button"
						>
							{ __( 'View' ) }
						</Button>
					) }
					<ToolsPanelItem
						hasValue={ () => !! description }
						label={ __( 'Description' ) }
						onDeselect={ () =>
							setAttributes( { description: '' } )
						}
						isShownByDefault
					>
						<TextareaControl
							label={ __( 'Description' ) }
							value={ description || '' }
							onChange={ ( descriptionValue ) => {
								setAttributes( {
									description: descriptionValue,
								} );
							} }
							help={ __(
								'The description will be displayed in the menu if the current theme supports it.'
							) }
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						hasValue={ () => !! rel }
						label={ __( 'Rel attribute' ) }
						onDeselect={ () => setAttributes( { rel: '' } ) }
						isShownByDefault
					>
						<TextControl
							__next40pxDefaultSize
							label={ __( 'Rel attribute' ) }
							value={ rel || '' }
							onChange={ ( relValue ) => {
								setAttributes( { rel: relValue } );
							} }
							autoComplete="off"
							help={ __(
								'The relationship of the linked URL as space-separated link types.'
							) }
						/>
					</ToolsPanelItem>
				</ToolsPanel>
			</InspectorControls>
			<div { ...blockProps }>
				<a
					className="wp-block-home-link__content wp-block-navigation-item__content"
					href={ homeUrl }
					onClick={ preventDefault }
				>
					<RichText
						identifier="label"
						className="wp-block-home-link__label"
						value={ label ?? __( 'Home' ) }
						onChange={ ( labelValue ) => {
							setAttributes( { label: labelValue } );
						} }
						aria-label={ __( 'Home link text' ) }
						placeholder={ __( 'Add home link' ) }
						withoutInteractiveFormatting
					/>
					{ description && (
						<span className="wp-block-navigation-item__description">
							{ description }
						</span>
					) }
				</a>
			</div>
		</>
	);
}
