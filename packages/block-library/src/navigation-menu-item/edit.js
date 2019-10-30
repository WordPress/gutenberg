/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import {
	ExternalLink,
	PanelBody,
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
import { RichText } from '@wordpress/editor';
import {
	BlockControls,
	InnerBlocks,
	InspectorControls,
	URLPopover,
} from '@wordpress/block-editor';
import {
	Fragment,
	useRef,
	useState,
} from '@wordpress/element';

function NavigationMenuItemEdit( {
	attributes,
	isSelected,
	isParentOfSelectedBlock,
	setAttributes,
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
				{ ( isSelected || isParentOfSelectedBlock ) &&
					<InnerBlocks
						allowedBlocks={ [ 'core/navigation-menu-item' ] }
					/>
				}
			</div>
		</Fragment>
	);
}

export default withSelect( ( select, ownProps ) => {
	const { hasSelectedInnerBlock } = select( 'core/block-editor' );
	const { clientId } = ownProps;

	return {
		isParentOfSelectedBlock: hasSelectedInnerBlock( clientId, true ),
	};
} )( NavigationMenuItemEdit );
