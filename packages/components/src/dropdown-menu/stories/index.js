/**
 * External dependencies
 */
import { text, boolean } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import DropdownMenu from '../';

/**
 * WordPress dependencies
 */
import { menu, arrowUp, arrowDown } from '@wordpress/icons';

export default {
	title: 'Components/DropdownMenu',
	component: DropdownMenu,
	parameters: {
		knobs: { disable: false },
	},
};

export const _default = () => {
	const label = text( 'Label', 'Select a direction.' );
	const firstMenuItemLabel = text( 'First Menu Item Label', 'Up' );
	const secondMenuItemLabel = text( 'First Menu Item Label', 'Down' );
	const toggleButtonTootip = boolean(
		'Show tooltip on a toggle button',
		true
	);

	const controls = [
		{
			title: firstMenuItemLabel,
			icon: arrowUp,
		},
		{
			title: secondMenuItemLabel,
			icon: arrowDown,
		},
	];

	return (
		<DropdownMenu
			icon={ menu }
			label={ label }
			controls={ controls }
			toggleProps={ { showTooltip: toggleButtonTootip } }
		/>
	);
};
