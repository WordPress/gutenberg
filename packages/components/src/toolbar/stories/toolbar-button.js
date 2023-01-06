/**
 * External dependencies
 */
import { text } from '@storybook/addon-knobs';

/**
 * WordPress dependencies
 */
import { wordpress } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { Toolbar } from '../../';
import ToolbarButton from '../';

export default {
	title: 'Components/ToolbarButton',
	component: ToolbarButton,
	parameters: {
		knobs: { disable: false },
	},
};

export const _default = () => {
	const label = text( 'Label', 'This is an example label.' );

	return (
		<Toolbar label="Example Toolbar">
			<ToolbarButton icon={ wordpress } label={ label } />
		</Toolbar>
	);
};
