/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { createBlock } from '@wordpress/blocks';
import { withDispatch, withSelect } from '@wordpress/data';
import {
	ExternalLink,
	PanelBody,
	Path,
	SVG,
	TextareaControl,
	TextControl,
	Toolbar,
	ToggleControl,
	ToolbarButton,
} from '@wordpress/components';
import {
	LEFT,
	RIGHT,
	UP,
	DOWN,
	BACKSPACE,
	ENTER,
} from '@wordpress/keycodes';
import { __ } from '@wordpress/i18n';
import {
	BlockControls,
	InnerBlocks,
	InspectorControls,
	RichText,
	__experimentalLinkControl as LinkControl,
} from '@wordpress/block-editor';
import { Fragment, useState } from '@wordpress/element';

function NavigationMenuItemEdit( {
	attributes,
	hasDescendants,
	isSelected,
	isParentOfSelectedBlock,
	setAttributes,
	insertMenuItemBlock,
	fetchSearchSuggestions,
} ) {
	const { label, link } = attributes;
	const linkSettings = { 'new-tab': link.newTab };
	const [ isLinkOpen, setIsLinkOpen ] = useState( false );

	/**
	 * `onKeyDown` LinkControl handler.
	 * It takes over to stop the event propagation to make the
	 * navigation work, avoiding undesired behaviors.
	 * For instance, it will block to move between menu items
	 * when the LinkOver is focused.
	 *
	 * @param {Object} event
	 */
	const handleLinkControlOnKeyDown = ( event ) => {
		const { keyCode } = event;

		if ( [ LEFT, DOWN, RIGHT, UP, BACKSPACE, ENTER ].indexOf( keyCode ) > -1 ) {
			// Stop the key event from propagating up to ObserveTyping.startTypingInTextField.
			event.stopPropagation();
		}
	};

	/**
	 * Updates the link attribute when it changes
	 * through of the `onLinkChange` LinkControl callback.
	 *
	 * @param {Object|null} newlink The object link if it has been selected, or null.
	 */
	const updateLink = ( newlink ) => {
		if ( ! newlink ) {
			return;
		}
		setAttributes( { link: newlink } );
	};

	/**
	 * It updates the link attribute when the
	 * link settings changes.
	 *
	 * @param {string} setting Setting type, for instance, `new-tab`.
	 * @param {string} value Setting type value.
	 */
	const updateLinkSetting = ( setting, value ) => {
		const newTab = 'new-tab' === setting ? value : link.newTab;
		setAttributes( { link: { ...link, newTab } } );
	};
	return (
		<Fragment>
			<BlockControls>
				<Toolbar>
					<ToolbarButton
						name="link"
						icon="admin-links"
						title={ __( 'Link' ) }
						onClick={ () => setIsLinkOpen( ! isLinkOpen ) }
					/>
					<ToolbarButton
						name="submenu"
						icon={ <SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24"><Path d="M14 5h8v2h-8zm0 5.5h8v2h-8zm0 5.5h8v2h-8zM2 11.5C2 15.08 4.92 18 8.5 18H9v2l3-3-3-3v2h-.5C6.02 16 4 13.98 4 11.5S6.02 7 8.5 7H12V5H8.5C4.92 5 2 7.92 2 11.5z" /><Path fill="none" d="M0 0h24v24H0z" /></SVG> }
						title={ __( 'Add submenu item' ) }
						onClick={ insertMenuItemBlock }
					/>
				</Toolbar>
			</BlockControls>
			<InspectorControls>
				<PanelBody
					title={ __( 'Menu Settings' ) }
				>
					<ToggleControl
						checked={ attributes.opensInNewTab }
						onChange={ ( opensInNewTab ) => {
							setAttributes( { opensInNewTab } );
						} }
						label={ __( 'Open in new tab' ) }
					/>
					<TextareaControl
						value={ attributes.description || '' }
						onChange={ ( description ) => {
							setAttributes( { description } );
						} }
						label={ __( 'Description' ) }
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'SEO Settings' ) }
				>
					<TextControl
						value={ attributes.title || '' }
						onChange={ ( title ) => {
							setAttributes( { title } );
						} }
						label={ __( 'Title Attribute' ) }
						help={ __( 'Provide more context about where the link goes.' ) }
					/>
					<ToggleControl
						checked={ attributes.nofollow }
						onChange={ ( nofollow ) => {
							setAttributes( { nofollow } );
						} }
						label={ __( 'Add nofollow to menu item' ) }
						help={ (
							<Fragment>
								{ __( 'Don\'t let search engines follow this link.' ) }
								<ExternalLink
									className="wp-block-navigation-menu-item__nofollow-external-link"
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
				'wp-block-navigation-menu-item', {
					'is-editing': isSelected || isParentOfSelectedBlock,
					'is-selected': isSelected,
				} ) }
			>
				<RichText
					className="wp-block-navigation-menu-item__content"
					value={ label }
					onChange={ ( labelValue ) => setAttributes( { label: labelValue } ) }
					placeholder={ __( 'Add item…' ) }
					withoutInteractiveFormatting
				/>
				{ isLinkOpen &&
					<LinkControl
						className="wp-block-navigation-menu-item__inline-link-input"
						onKeyDown={ handleLinkControlOnKeyDown }
						onKeyPress={ ( event ) => event.stopPropagation() }
						currentLink={ link }
						onLinkChange={ updateLink }
						onClose={ () => setIsLinkOpen( false ) }
						currentSettings={ linkSettings }
						onSettingsChange={ updateLinkSetting }
						fetchSearchSuggestions={ fetchSearchSuggestions }
					/>
				}
				<InnerBlocks
					allowedBlocks={ [ 'core/navigation-menu-item' ] }
					renderAppender={ hasDescendants ? InnerBlocks.ButtonBlockAppender : false }
				/>
			</div>
		</Fragment>
	);
}

export default compose( [
	withSelect( ( select, ownProps ) => {
		const { getClientIdsOfDescendants, hasSelectedInnerBlock, getSettings } = select( 'core/block-editor' );
		const { clientId } = ownProps;

		return {
			isParentOfSelectedBlock: hasSelectedInnerBlock( clientId, true ),
			hasDescendants: !! getClientIdsOfDescendants( [ clientId ] ).length,
			fetchSearchSuggestions: getSettings().__experimentalFetchLinkSuggestions,
		};
	} ),
	withDispatch( ( dispatch, ownProps ) => {
		return {
			insertMenuItemBlock() {
				const { clientId } = ownProps;

				const {
					insertBlock,
				} = dispatch( 'core/block-editor' );

				const blockToInsert = createBlock( 'core/navigation-menu-item' );
				insertBlock(
					blockToInsert,
					0,
					clientId,
				);
			},
		};
	} ),
] )( NavigationMenuItemEdit );
