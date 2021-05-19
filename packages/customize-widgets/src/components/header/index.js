/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { createPortal } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { Button, ToolbarItem } from '@wordpress/components';
import { NavigableToolbar } from '@wordpress/block-editor';
import { plus } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Inserter from '../inserter';
import MoreMenu from '../more-menu';

function Header( {
	inserter,
	isInserterOpened,
	setIsInserterOpened,
	isFixedToolbarActive,
} ) {
	return (
		<>
			<div
				className={ classnames( 'customize-widgets-header', {
					'is-fixed-toolbar-active': isFixedToolbarActive,
				} ) }
			>
				<NavigableToolbar
					className="customize-widgets-header-toolbar"
					aria-label={ __( 'Document tools' ) }
				>
					<ToolbarItem
						as={ Button }
						className="customize-widgets-header-toolbar__inserter-toggle"
						isPressed={ isInserterOpened }
						isPrimary
						icon={ plus }
						label={ _x(
							'Add block',
							'Generic label for block inserter button'
						) }
						onClick={ () => {
							setIsInserterOpened( ( isOpen ) => ! isOpen );
						} }
					/>
					<MoreMenu />
				</NavigableToolbar>
			</div>

			{ createPortal(
				<Inserter setIsOpened={ setIsInserterOpened } />,
				inserter.contentContainer[ 0 ]
			) }
		</>
	);
}

export default Header;
