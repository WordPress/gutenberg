/**
 * External dependencies
 */
import { text, object } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import DropdownMenu from '../';

export default { title: 'Components/DropdownMenu', component: DropdownMenu };

export const _default = () => {
	const label = text( 'Label', 'Select a direction.' );
	const icon = text( 'Icon', 'ellipsis' );
	const controls = object( 'Controls', [
		{
			title: 'Up',
			icon: 'arrow-up',
		},
		{
			title: 'Down',
			icon: 'arrow-down',
		},
	] );
	return <DropdownMenu icon={ icon } label={ label } controls={ controls } />;
};
