/**
 * WordPress dependencies
 */
import {
	DropdownMenu,
	Icon,
	ToolbarButton,
	__experimentalToolbarItem as ToolbarItem,
	ToolbarGroup,
	__experimentalInputControl as InputControl,
} from '@wordpress/components';
import {
	chevronDown as arrowDownIcon,
	link as linkIcon,
	check as checkIcon,
} from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { useEffect, useRef, useState } from '@wordpress/element';
import { BlockControls, useDisplayUrl } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import SuggestionsPopover from './suggestions-popover';

export default function ToolbarLinkControl( {
	link: { url, label, opensInNewTab, nofollow },
	isOpen,
	close,
	onChange,
} ) {
	const displayUrl = useDisplayUrl( url );
	const [ editUrl, setEditUrl ] = useState( displayUrl );
	const [ showSuggestions, setShowSuggestions ] = useState( false );

	const inputRef = useRef();

	useEffect( () => {
		if ( isOpen ) {
			setEditUrl( displayUrl );
			// eslint-disable-next-line @wordpress/react-no-unsafe-timeout
			setTimeout( () => {
				if ( inputRef.current ) {
					inputRef.current.focus();
				}
			} );
		}
	}, [ isOpen ] );

	const finishLinkEditing = ( acceptChanges = true ) => {
		if ( acceptChanges ) {
			onChange( { url: editUrl } );
		}
		close();
	};

	return (
		<BlockControls __experimentalIsExpanded={ true }>
			<ToolbarGroup className="toolbar-link-control__input-group">
				<ToolbarItem ref={ inputRef }>
					{ ( toolbarItemProps ) => (
						<InputControl
							{ ...toolbarItemProps }
							placeholder={ 'Search or type a URL' }
							className="toolbar-link-control__input-control"
							value={ editUrl }
							prefix={
								<div className="toolbar-link-control__icon">
									<Icon icon={ linkIcon } size={ 24 } />
								</div>
							}
							onChange={ ( currentUrl ) => {
								if ( ! showSuggestions ) {
									setShowSuggestions( true );
								}
								setEditUrl( currentUrl );
							} }
							onKeyDown={ ( e ) => {
								if ( e.which === 13 ) {
									finishLinkEditing( true );
								}
								if ( e.which === 27 ) {
									finishLinkEditing( false );
								}
							} }
							onKeyUp={ () => {} }
						/>
					) }
				</ToolbarItem>
				<ToolbarItem>
					{ ( toolbarItemProps ) => (
						<DropdownMenu
							position="bottom"
							className="link-option"
							closeOnClick={ false }
							contentClassName="link-options__popover"
							icon={ arrowDownIcon }
							toggleProps={ {
								...toolbarItemProps,
								name: 'link-options',
								title: __( 'Link options' ),
							} }
							controls={ [
								[
									{
										title: 'Remove link',
										onClick: ( closeMenu ) => {
											setEditUrl( '' );
											closeMenu();
										},
									},
									{
										title: (
											<>
												<span className="toolbar-link-control__toggle-menu-item-label">
													Open in new tab
												</span>
												{ opensInNewTab && (
													<Icon icon={ checkIcon } />
												) }
											</>
										),
										onClick: () => {
											onChange( {
												opensInNewTab: ! opensInNewTab,
											} );
										},
									},
									{
										title: (
											<>
												<span className="toolbar-link-control__toggle-menu-item-label">
													Add nofollow attribute
												</span>
												{ nofollow && (
													<Icon icon={ checkIcon } />
												) }
											</>
										),
										onClick: () => {
											onChange( {
												nofollow: ! nofollow,
											} );
										},
									},
								],
							] }
						/>
					) }
				</ToolbarItem>
			</ToolbarGroup>
			<ToolbarGroup>
				<ToolbarButton
					name="done"
					title={ __( 'Done' ) }
					onClick={ () => finishLinkEditing( true ) }
				>
					Done
				</ToolbarButton>
			</ToolbarGroup>

			{ showSuggestions && (
				<SuggestionsPopover
					url={ url }
					inputValue={ editUrl }
					close={ close }
					onSelect={ ( data ) => onChange( data ) }
					label={ label }
					anchorRef={ inputRef }
				/>
			) }
		</BlockControls>
	);
}
