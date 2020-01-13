/**
 * External dependencies
 */
import classnames from 'classnames';
import { escape, unescape } from 'lodash';

/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { createBlock } from '@wordpress/blocks';
import { withDispatch, withSelect } from '@wordpress/data';
import {
	ExternalLink,
	KeyboardShortcuts,
	PanelBody,
	Path,
	SVG,
	TextareaControl,
	TextControl,
	ToggleControl,
	ToolbarButton,
	ToolbarGroup,
} from '@wordpress/components';
import {
	rawShortcut,
	displayShortcut,
} from '@wordpress/keycodes';
import { __ } from '@wordpress/i18n';
import {
	BlockControls,
	InnerBlocks,
	InspectorControls,
	RichText,
	__experimentalLinkControl as LinkControl,
} from '@wordpress/block-editor';
import { Fragment, useState, useEffect } from '@wordpress/element';

function NavigationLinkEdit( {
	attributes,
	hasDescendants,
	isSelected,
	isParentOfSelectedBlock,
	setAttributes,
	insertLinkBlock,
} ) {
	const { label, opensInNewTab, title, url, nofollow, description } = attributes;
	const link = {
		title: title ? unescape( title ) : '',
		url,
		opensInNewTab,
	};
	const [ isLinkOpen, setIsLinkOpen ] = useState( false );
	const itemLabelPlaceholder = __( 'Add link…' );

	// Show the LinkControl on mount if the URL is empty
	// ( When adding a new menu item)
	// This can't be done in the useState call because it cconflicts
	// with the autofocus behavior of the BlockListBlock component.
	useEffect( () => {
		if ( ! url ) {
			setIsLinkOpen( true );
		}
	}, [] );

	/**
	 * The hook shouldn't be necessary but due to a focus loss happening
	 * when selecting a suggestion in the link popover, we force close on block unselection.
	 */
	useEffect( () => {
		if ( ! isSelected ) {
			setIsLinkOpen( false );
		}
	}, [ isSelected ] );

	return (
		<Fragment>
			<BlockControls>
				<ToolbarGroup>
					<KeyboardShortcuts
						bindGlobal
						shortcuts={ {
							[ rawShortcut.primary( 'k' ) ]: () => setIsLinkOpen( true ),
						} }
					/>
					<ToolbarButton
						name="link"
						icon="admin-links"
						title={ __( 'Link' ) }
						shortcut={ displayShortcut.primary( 'k' ) }
						onClick={ () => setIsLinkOpen( true ) }
					/>
					<ToolbarButton
						name="submenu"
						icon={ <SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24"><Path d="M14 5h8v2h-8zm0 5.5h8v2h-8zm0 5.5h8v2h-8zM2 11.5C2 15.08 4.92 18 8.5 18H9v2l3-3-3-3v2h-.5C6.02 16 4 13.98 4 11.5S6.02 7 8.5 7H12V5H8.5C4.92 5 2 7.92 2 11.5z" /><Path fill="none" d="M0 0h24v24H0z" /></SVG> }
						title={ __( 'Add submenu' ) }
						onClick={ insertLinkBlock }
					/>
				</ToolbarGroup>
			</BlockControls>
			<InspectorControls>
				<PanelBody
					title={ __( 'Link Settings' ) }
				>
					<TextareaControl
						value={ description || '' }
						onChange={ ( descriptionValue ) => {
							setAttributes( { description: descriptionValue } );
						} }
						label={ __( 'Description' ) }
						help={ __( 'The description will be displayed in the menu if the current theme supports it.' ) }
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'SEO Settings' ) }
				>
					<TextControl
						value={ title || '' }
						onChange={ ( titleValue ) => {
							setAttributes( { title: titleValue } );
						} }
						label={ __( 'Title Attribute' ) }
						help={ __( 'Provide more context about where the link goes.' ) }
					/>
					<ToggleControl
						checked={ nofollow }
						onChange={ ( nofollowValue ) => {
							setAttributes( { nofollow: nofollowValue } );
						} }
						label={ __( 'Add nofollow to link' ) }
						help={ (
							<Fragment>
								{ __( 'Don\'t let search engines follow this link.' ) }
								<ExternalLink
									className="wp-block-navigation-link__nofollow-external-link"
									href={ __( 'https://codex.wordpress.org/Nofollow' ) }
								>
									{ __( 'What\'s this?' ) }
								</ExternalLink>
							</Fragment>
						) }
					/>
				</PanelBody>
			</InspectorControls>
			<div className={ classnames(
				'wp-block-navigation-link', {
					'is-editing': isSelected || isParentOfSelectedBlock,
					'is-selected': isSelected,
					'has-link': !! url,
				} ) }
			>
				<div>
					<RichText
						className="wp-block-navigation-link__content"
						value={ label }
						onChange={ ( labelValue ) => setAttributes( { label: labelValue } ) }
						placeholder={ itemLabelPlaceholder }
						withoutInteractiveFormatting
						allowedFormats={ [
							'core/bold',
							'core/italic',
							'core/image',
							'core/strikethrough',
						] }
					/>
					{ isLinkOpen && (
						<LinkControl
							className="wp-block-navigation-link__inline-link-input"
							value={ link }
							onChange={ ( {
								title: newTitle = '',
								url: newURL = '',
								opensInNewTab: newOpensInNewTab,
							} = {} ) => setAttributes( {
								title: escape( newTitle ),
								url: newURL,
								label: label || escape( newTitle ),
								opensInNewTab: newOpensInNewTab,
							} ) }
							onClose={ () => setIsLinkOpen( false ) }
						/>
					) }
				</div>
				<InnerBlocks
					allowedBlocks={ [ 'core/navigation-link' ] }
					renderAppender={ hasDescendants ? InnerBlocks.ButtonBlockAppender : false }
				/>
			</div>
		</Fragment>
	);
}

export default compose( [
	withSelect( ( select, ownProps ) => {
		const { getClientIdsOfDescendants, hasSelectedInnerBlock } = select( 'core/block-editor' );
		const { clientId } = ownProps;

		return {
			isParentOfSelectedBlock: hasSelectedInnerBlock( clientId, true ),
			hasDescendants: !! getClientIdsOfDescendants( [ clientId ] ).length,
		};
	} ),
	withDispatch( ( dispatch, ownProps, registry ) => {
		return {
			insertLinkBlock() {
				const { clientId } = ownProps;

				const {
					insertBlock,
				} = dispatch( 'core/block-editor' );

				const { getClientIdsOfDescendants } = registry.select( 'core/block-editor' );
				const navItems = getClientIdsOfDescendants( [ clientId ] );
				const insertionPoint = navItems.length ? navItems.length : 0;

				const blockToInsert = createBlock( 'core/navigation-link' );

				insertBlock(
					blockToInsert,
					insertionPoint,
					clientId,
				);
			},
		};
	} ),
] )( NavigationLinkEdit );
