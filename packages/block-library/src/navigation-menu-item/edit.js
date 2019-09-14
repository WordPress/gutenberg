/**
 * External dependencies
 */
import { invoke } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	Dropdown,
	ExternalLink,
	IconButton,
	PanelBody,
	TextareaControl,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	InnerBlocks,
	InspectorControls,
	PlainText,
} from '@wordpress/block-editor';
import {
	Fragment,
	useCallback,
	useRef,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import MenuItemActions from './menu-item-actions';
const POPOVER_PROPS = { noArrow: true };

function NavigationMenuItemEdit( {
	attributes,
	clientId,
	isSelected,
	setAttributes,
} ) {
	const plainTextRef = useRef( null );
	const onEditLableClicked = useCallback(
		( onClose ) => () => {
			onClose();
			invoke( plainTextRef, [ 'current', 'textarea', 'focus' ] );
		},
		[ plainTextRef ]
	);
	let content;
	if ( isSelected ) {
		content = (
			<div className="wp-block-navigation-menu-item__edit-container">
				<PlainText
					ref={ plainTextRef }
					className="wp-block-navigation-menu-item__field"
					value={ attributes.label }
					onChange={ ( label ) => setAttributes( { label } ) }
					aria-label={ __( 'Navigation Label' ) }
					maxRows={ 1 }
				/>
				<Dropdown
					contentClassName="wp-block-navigation-menu-item__dropdown-content"
					position="bottom left"
					popoverProps={ POPOVER_PROPS }
					renderToggle={ ( { isOpen, onToggle } ) => (
						<IconButton
							icon={ isOpen ? 'arrow-up-alt2' : 'arrow-down-alt2' }
							label={ __( 'More options' ) }
							onClick={ onToggle }
							aria-expanded={ isOpen }
						/>
					) }
					renderContent={ ( { onClose } ) => (
						<MenuItemActions
							clientId={ clientId }
							destination={ attributes.destination }
							onEditLableClicked={ onEditLableClicked( onClose ) }
						/>
					) }
				/>
			</div>
		);
	} else {
		content = attributes.label;
	}
	return (
		<Fragment>
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
			<div className="wp-block-navigation-menu-item">
				{ content }
				<InnerBlocks
					allowedBlocks={ [ 'core/navigation-menu-item' ] }
					renderAppender={ InnerBlocks.ButtonBlockAppender }
				/>
			</div>
		</Fragment>
	);
}

export default NavigationMenuItemEdit;
