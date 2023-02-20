/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	MenuGroup,
	MenuItem,
	ToolbarDropdownMenu,
} from '@wordpress/components';
import { formatCapitalize, check } from '@wordpress/icons';

import { __ } from '@wordpress/i18n';

export default function FontAppearanceControl( {
	isBold,
	isItalic,
	toggleBold,
	toggleItalic,
} ) {
	const controls = [
		{
			key: 'bold',
			title: __( 'Bold' ),
			style: { fontWeight: 'bold' },
			onClick: toggleBold,
			isActive: isBold,
			role: 'menuitemcheckbox',
		},
		{
			key: 'italic',
			title: __( 'Italic' ),
			style: { fontStyle: 'italic' },
			onClick: toggleItalic,
			isActive: isItalic,
			role: 'menuitemcheckbox',
		},
	];

	return (
		<ToolbarDropdownMenu
			className="font-appearance-toolbar-control"
			label={ __( 'Change font appareance' ) }
			icon={ formatCapitalize }
			toggleProps={ { isPressed: isBold || isItalic } }
		>
			{ () => (
				<MenuGroup label={ __( 'Font appareance' ) }>
					{ controls.map( ( control ) => (
						<MenuItem
							key={ control.key }
							onClick={ control.onClick }
							role={ control.role }
							icon={ check }
							className={ classNames(
								'font-appearance-toolbar-control__option',
								'components-dropdown-menu__menu-item',
								{
									'is-active': control.isActive,
								}
							) }
							isSelected={ control.isActive }
							style={ control.style }
						>
							{ control.title }
						</MenuItem>
					) ) }
				</MenuGroup>
			) }
		</ToolbarDropdownMenu>
	);
}
