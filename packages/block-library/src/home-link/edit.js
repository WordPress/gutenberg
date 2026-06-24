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
	store as blockEditorStore,
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
	const {
		homeUrl,
		onNavigateToEntityRecord,
		frontPageId,
		frontPageTemplateId,
	} = useSelect( ( select ) => {
		const { getEntityRecord, getDefaultTemplateId, canUser } =
			select( coreStore );

		// Site index.
		const baseUrl = getEntityRecord( 'root', '__unstableBase' )?.home;

		// Front-page data (only available if the user can read site settings).
		const canReadSettings = canUser( 'read', {
			kind: 'root',
			name: 'site',
		} );
		const site = canReadSettings ? getEntityRecord( 'root', 'site' ) : null;
		const resolvedFrontPageId =
			site?.show_on_front === 'page' ? site?.page_on_front : null;

		// When no specific front page is set, fall back to the front-page template.
		const resolvedFrontPageTemplateId = ! resolvedFrontPageId
			? getDefaultTemplateId( { slug: 'front-page' } )
			: null;

		return {
			homeUrl: baseUrl,
			onNavigateToEntityRecord:
				select( blockEditorStore ).getSettings()
					.onNavigateToEntityRecord,
			frontPageId: resolvedFrontPageId,
			frontPageTemplateId: resolvedFrontPageTemplateId,
		};
	}, [] );

	const { textColor, backgroundColor, style } = context;
	const { label, opensInNewTab, description } = attributes;
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
					{ onNavigateToEntityRecord &&
						( frontPageId || frontPageTemplateId ) && (
							<Button
								variant="secondary"
								onClick={ () => {
									if ( frontPageId ) {
										onNavigateToEntityRecord( {
											postId: frontPageId,
											postType: 'page',
										} );
									} else {
										onNavigateToEntityRecord( {
											postId: frontPageTemplateId,
											postType: 'wp_template',
										} );
									}
								} }
								__next40pxDefaultSize
								className="navigation-link-to__action-button"
							>
								{ __( 'Edit' ) }
							</Button>
						) }
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
						placeholder={ __( 'Add label…' ) }
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
