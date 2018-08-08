/**
 * External dependencies
 */
import classnames from 'classnames';
import { castArray } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { IconButton, Dropdown, NavigableMenu } from '@wordpress/components';
import { withDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import BlockModeToggle from './block-mode-toggle';
import BlockDuplicateButton from './block-duplicate-button';
import BlockRemoveButton from './block-remove-button';
import ReusableBlockConvertButton from './reusable-block-convert-button';
import ReusableBlockDeleteButton from './reusable-block-delete-button';
import BlockHTMLConvertButton from './block-html-convert-button';
import BlockUnknownConvertButton from './block-unknown-convert-button';
import _BlockSettingsMenuFirstItem from './block-settings-menu-first-item';
import _BlockSettingsMenuPluginsExtension from './block-settings-menu-plugins-extension';

export class BlockSettingsMenu extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			isFocused: false,
		};
		this.onFocus = this.onFocus.bind( this );
		this.onBlur = this.onBlur.bind( this );
	}

	onFocus() {
		this.setState( {
			isFocused: true,
		} );
	}

	onBlur() {
		this.setState( {
			isFocused: false,
		} );
	}

	render() {
		const {
			clientIds,
			onSelect,
			focus,
			rootClientId,
			isHidden,
		} = this.props;
		const { isFocused } = this.state;
		const blockClientIds = castArray( clientIds );
		const count = blockClientIds.length;
		const firstBlockClientId = blockClientIds[ 0 ];

		return (
			<div className="editor-block-settings-menu">
				<Dropdown
					contentClassName="editor-block-settings-menu__popover"
					position="bottom left"
					renderToggle={ ( { onToggle, isOpen } ) => {
						const toggleClassname = classnames( 'editor-block-settings-menu__toggle', {
							'is-opened': isOpen,
							'is-visible': isFocused || isOpen || ! isHidden,
						} );
						const label = isOpen ? __( 'Hide Options' ) : __( 'More Options' );

						return (
							<IconButton
								className={ toggleClassname }
								onClick={ () => {
									if ( count === 1 ) {
										onSelect( firstBlockClientId );
									}
									onToggle();
								} }
								icon="ellipsis"
								label={ label }
								aria-expanded={ isOpen }
								focus={ focus }
								onFocus={ this.onFocus }
								onBlur={ this.onBlur }
							/>
						);
					} }
					renderContent={ ( { onClose } ) => (
						// Should this just use a DropdownMenu instead of a DropDown ?
						<NavigableMenu className="editor-block-settings-menu__content">
							<_BlockSettingsMenuFirstItem.Slot fillProps={ { onClose } } />
							{ count === 1 && (
								<BlockModeToggle
									clientId={ firstBlockClientId }
									onToggle={ onClose }
									role="menuitem"
								/>
							) }
							{ count === 1 && (
								<BlockUnknownConvertButton
									clientId={ firstBlockClientId }
									role="menuitem"
								/>
							) }
							{ count === 1 && (
								<BlockHTMLConvertButton
									clientId={ firstBlockClientId }
									role="menuitem"
								/>
							) }
							<BlockDuplicateButton
								clientIds={ clientIds }
								rootClientId={ rootClientId }
								role="menuitem"
							/>
							{ count === 1 && (
								<ReusableBlockConvertButton
									clientId={ firstBlockClientId }
									onToggle={ onClose }
									itemsRole="menuitem"
								/>
							) }
							<_BlockSettingsMenuPluginsExtension.Slot fillProps={ { clientIds, onClose } } />
							<div className="editor-block-settings-menu__separator" />
							{ count === 1 && (
								<ReusableBlockDeleteButton
									clientId={ firstBlockClientId }
									onToggle={ onClose }
									itemsRole="menuitem"
								/>
							) }
							<BlockRemoveButton
								clientIds={ clientIds }
								role="menuitem"
							/>
						</NavigableMenu>
					) }
				/>
			</div>
		);
	}
}

export default withDispatch( ( dispatch ) => ( {
	onSelect( clientId ) {
		dispatch( 'core/editor' ).selectBlock( clientId );
	},
} ) )( BlockSettingsMenu );
