/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { DropdownMenu, MenuGroup } from '@wordpress/components';
import { moreVertical } from '@wordpress/icons';
import { useLayoutEffect, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ModeSwitcher from '../mode-switcher';
import PluginMoreMenuGroup from '../plugins-more-menu-group';
import ToolsMoreMenuGroup from '../tools-more-menu-group';
import OptionsMenuItem from '../options-menu-item';
import WritingMenu from '../writing-menu';

const TOGGLE_PROPS = {
	tooltipPosition: 'bottom',
};

const MoreMenu = ( { showIconLabel } ) => {
	const [ anchorRect, setAnchorRect ] = useState( {} );
	const currentNode = useRef();
	const position = showIconLabel ? 'top' : 'bottom left';
	const POPOVER_PROPS = {
		anchorRect,
		className: 'edit-post-more-menu__content',
		position,
	};

	useLayoutEffect( () => {
		function updatePosition() {
			if ( currentNode.current ) {
				const boundingClientRect = currentNode.current.getBoundingClientRect();

				setAnchorRect( boundingClientRect );
			}
		}
		window.addEventListener( 'resize', updatePosition );
		updatePosition();
		return () => window.removeEventListener( 'resize', updatePosition );
	}, [] );

	return (
		<div ref={ currentNode }>
			<DropdownMenu
				className={ classnames( 'edit-post-more-menu', {
					'show-icon-label': showIconLabel,
				} ) }
				icon={ moreVertical }
				label={ __( 'More options' ) }
				popoverProps={ POPOVER_PROPS }
				toggleProps={ {
					...TOGGLE_PROPS,
					showIconLabel,
					showTooltip: ! showIconLabel,
				} }
			>
				{ ( { onClose } ) => (
					<>
						<WritingMenu />
						<ModeSwitcher />
						<PluginMoreMenuGroup.Slot fillProps={ { onClose } } />
						<ToolsMoreMenuGroup.Slot fillProps={ { onClose } } />
						<MenuGroup>
							<OptionsMenuItem />
						</MenuGroup>
					</>
				) }
			</DropdownMenu>
		</div>
	);
};

export default MoreMenu;
