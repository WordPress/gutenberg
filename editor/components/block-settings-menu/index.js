/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component, Fragment } from '@wordpress/element';
import { IconButton, Dropdown, NavigableMenu } from '@wordpress/components';
import { withDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import './style.scss';
import BlockModeToggle from './block-mode-toggle';
import BlockRemoveButton from './block-remove-button';
import BlockDuplicateButton from './block-duplicate-button';
import BlockTransformations from './block-transformations';
import SharedBlockSettings from './shared-block-settings';
import UnknownConverter from './unknown-converter';

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
			uids,
			onSelect,
			focus,
			rootUID,
			renderBlockMenu = ( { children } ) => children,
			isHidden,
		} = this.props;
		const { isFocused } = this.state;
		const count = uids.length;

		return (
			<Dropdown
				className={ classnames( 'editor-block-settings-menu', {
					'is-visible': isFocused || ! isHidden,
				} ) }
				contentClassName="editor-block-settings-menu__popover"
				position="bottom left"
				renderToggle={ ( { onToggle, isOpen } ) => {
					const toggleClassname = classnames( 'editor-block-settings-menu__toggle', {
						'is-opened': isOpen,
					} );

					return (
						<Fragment>
							<IconButton
								className={ toggleClassname }
								onClick={ () => {
									if ( uids.length === 1 ) {
										onSelect( uids[ 0 ] );
									}
									onToggle();
								} }
								icon="ellipsis"
								label={ __( 'More Options' ) }
								aria-expanded={ isOpen }
								focus={ focus }
								onFocus={ this.onFocus }
								onBlur={ this.onBlur }
							/>
							<BlockRemoveButton uids={ uids } />
						</Fragment>
					);
				} }
				renderContent={ ( { onClose } ) => (
				// Should this just use a DropdownMenu instead of a DropDown ?
					<NavigableMenu className="editor-block-settings-menu__content">
						{ renderBlockMenu( { onClose, children: [
							count === 1 && <BlockModeToggle key="mode-toggle" uid={ uids[ 0 ] } onToggle={ onClose } role="menuitem" />,
							count === 1 && <UnknownConverter key="unknown-converter" uid={ uids[ 0 ] } role="menuitem" />,
							<BlockDuplicateButton key="duplicate" uids={ uids } rootUID={ rootUID } role="menuitem" />,
							count === 1 && <SharedBlockSettings key="shared-block" uid={ uids[ 0 ] } onToggle={ onClose } itemsRole="menuitem" />,
							<BlockTransformations key="transformations" uids={ uids } onClick={ onClose } itemsRole="menuitem" />,
						] } ) }
					</NavigableMenu>
				) }
			/>
		);
	}
}

export default withDispatch( ( dispatch ) => ( {
	onSelect( uid ) {
		dispatch( 'core/editor' ).selectBlock( uid );
	},
} ) )( BlockSettingsMenu );
