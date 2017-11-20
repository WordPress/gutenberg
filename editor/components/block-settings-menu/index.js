/**
 * External dependencies
 */
import classnames from 'classnames';
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton, Dropdown, NavigableMenu } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import BlockInspectorButton from './block-inspector-button';
import BlockModeToggle from './block-mode-toggle';
import BlockDeleteButton from './block-delete-button';
import UnknownConverter from './unknown-converter';
import { selectBlock } from '../../state/actions';

function BlockSettingsMenu( { uids, onSelect, focus } ) {
	const count = uids.length;

	return (
		<Dropdown
			className="editor-block-settings-menu"
			contentClassName="editor-block-settings-menu__popover"
			position="bottom left"
			renderToggle={ ( { onToggle, isOpen } ) => {
				const toggleClassname = classnames( 'editor-block-settings-menu__toggle', {
					'is-opened': isOpen,
				} );

				return (
					<IconButton
						className={ toggleClassname }
						onClick={ () => {
							if ( uids.length === 1 ) {
								onSelect( uids[ 0 ] );
							}
							onToggle();
						} }
						icon="ellipsis"
						label={ isOpen ? __( 'Close Settings Menu' ) : __( 'Open Settings Menu' ) }
						aria-expanded={ isOpen }
						focus={ focus }
					/>
				);
			} }
			renderContent={ ( { onClose } ) => (
				// Should this just use a DropdownMenu instead of a DropDown ?
				<NavigableMenu className="editor-block-settings-menu__content">
					<BlockInspectorButton onClick={ onClose } />
					{ count === 1 && <BlockModeToggle uid={ uids[ 0 ] } onToggle={ onClose } /> }
					{ count === 1 && <UnknownConverter uid={ uids[ 0 ] } /> }
					<BlockDeleteButton uids={ uids } />
				</NavigableMenu>
			) }
		/>
	);
}

export default connect(
	undefined,
	( dispatch ) => ( {
		onSelect( uid ) {
			dispatch( selectBlock( uid ) );
		},
	} )
)( BlockSettingsMenu );
