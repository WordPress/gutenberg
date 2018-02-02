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
import BlockModeToggle from './block-mode-toggle';
import BlockRemoveButton from './block-remove-button';
import BlockTransformations from './block-transformations';
import ReusableBlockSettings from './reusable-block-settings';
import UnknownConverter from './unknown-converter';
import { selectBlock } from '../../store/actions';

function BlockSettingsMenu( {
	uids,
	onSelect,
	focus,
	renderBlockMenu = ( { children } ) => children }
) {
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
						label={ __( 'More Options' ) }
						aria-expanded={ isOpen }
						focus={ focus }
					/>
				);
			} }
			renderContent={ ( { onClose } ) => (
				// Should this just use a DropdownMenu instead of a DropDown ?
				<NavigableMenu className="editor-block-settings-menu__content">
					{ renderBlockMenu( { onClose, children: [
						count === 1 && <BlockModeToggle key="mode-toggle" uid={ uids[ 0 ] } onToggle={ onClose } />,
						count === 1 && <UnknownConverter key="unknown-converter" uid={ uids[ 0 ] } />,
						<BlockRemoveButton key="remove" uids={ uids } />,
						count === 1 && <ReusableBlockSettings key="reusable-block" uid={ uids[ 0 ] } onToggle={ onClose } />,
						<BlockTransformations key="transformations" uids={ uids } onClick={ onClose } />,
					] } ) }
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
