/**
 * External dependencies
 */
import { text } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import { Toolbar } from '../../';
import ToolbarButton from '../';

export default { title: 'Components/ToolbarButton', component: ToolbarButton };

export const _default = () => {
	const label = text( 'Label', 'This is an example label.' );
	const icon = text( 'Icon', 'wordpress' );

	return (
		<Toolbar label="Example Toolbar">
			<ToolbarButton icon={ icon } label={ label } />
		</Toolbar>
	);
};
