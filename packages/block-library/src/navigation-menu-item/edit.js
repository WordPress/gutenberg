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
	URLPopover,
	RichText,
} from '@wordpress/block-editor';
import {
	Fragment,
	useRef,
	useState,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockNavigationList from '../navigation-menu/block-navigation-list';

function NavigationMenuItemEdit( {
	attributes,
	hasDescendants,
	isSelected,
	isParentOfSelectedBlock,
	setAttributes,
	insertMenuItemBlock,
	parentNavigationClientId,
} ) {
	const [ isLinkOpen, setIsLinkOpen ] = useState( false );
	const [ isEditingLink, setIsEditingLink ] = useState( false );
	const [ urlInput, setUrlInput ] = useState( null );

	const inputValue = urlInput !== null ? urlInput : url;

	const onKeyDown = ( event ) => {
		if ( [ LEFT, DOWN, RIGHT, UP, BACKSPACE, ENTER ].indexOf( event.keyCode ) > -1 ) {
			// Stop the key event from propagating up to ObserveTyping.startTypingInTextField.
			event.stopPropagation();
		}
	};

	const closeURLPopover = () => {
		setIsEditingLink( false );
		setUrlInput( null );
		setIsLinkOpen( false );
	};

	const autocompleteRef = useRef( null );

	const onFocusOutside = ( event ) => {
		const autocompleteElement = autocompleteRef.current;
		if ( autocompleteElement && autocompleteElement.contains( event.target ) ) {
			return;
		}
		closeURLPopover();
	};

	const stopPropagation = ( event ) => {
		event.stopPropagation();
	};

	const { label, url } = attributes;

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
					{ <ToolbarButton
						name="submenu"
						icon={ <SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24"><Path d="M14 5h8v2h-8zm0 5.5h8v2h-8zm0 5.5h8v2h-8zM2 11.5C2 15.08 4.92 18 8.5 18H9v2l3-3-3-3v2h-.5C6.02 16 4 13.98 4 11.5S6.02 7 8.5 7H12V5H8.5C4.92 5 2 7.92 2 11.5z" /><Path fill="none" d="M0 0h24v24H0z" /></SVG> }
						title={ __( 'Add submenu item' ) }
						onClick={ insertMenuItemBlock }
					/> }
				</Toolbar>
				{ isLinkOpen &&
					<>
						<URLPopover
							className="wp-block-navigation-menu-item__inline-link-input"
							onClose={ closeURLPopover }
							onFocusOutside={ onFocusOutside }
						>
							{ ( ! url || isEditingLink ) &&
							<URLPopover.LinkEditor
								value={ inputValue }
								onChangeInputValue={ setUrlInput }
								onKeyPress={ stopPropagation }
								onKeyDown={ onKeyDown }
								onSubmit={ ( event ) => event.preventDefault() }
								autocompleteRef={ autocompleteRef }
							/>
							}
							{ ( url && ! isEditingLink ) &&
								<URLPopover.LinkViewer
									onKeyPress={ stopPropagation }
									url={ url }
								/>
							}

						</URLPopover>
					</>
				}
			</BlockControls>
			<InspectorControls>
				<PanelBody
					title={ __( 'Navigation Structure' ) }
				>
					<BlockNavigationList clientId={ parentNavigationClientId } />
				</PanelBody>
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
				{ ( isSelected || isParentOfSelectedBlock ) &&
					<InnerBlocks
						allowedBlocks={ [ 'core/navigation-menu-item' ] }
						renderAppender={ hasDescendants ? InnerBlocks.ButtonBlockAppender : false }
					/>
				}
			</div>
		</Fragment>
	);
}

export default compose( [
	withSelect( ( select, ownProps ) => {
		const {
			getClientIdsOfDescendants,
			hasSelectedInnerBlock,
			__experimentalGetClosestParentWithName: getClosestParentWithName,
		} = select( 'core/block-editor' );
		const { clientId } = ownProps;

		return {
			isParentOfSelectedBlock: hasSelectedInnerBlock( clientId, true ),
			hasDescendants: !! getClientIdsOfDescendants( [ clientId ] ).length,
			parentNavigationClientId: getClosestParentWithName( clientId, 'core/navigation-menu' ),
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
