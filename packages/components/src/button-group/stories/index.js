/**
 * Internal dependencies
 */
import Button from '../../button';
import ButtonGroup from '../';

export default { title: 'Button Group', component: ButtonGroup };

export const _default = () => (
	<ButtonGroup>
		<Button isPrimary>Button 1</Button>
		<Button isPrimary>Button 2</Button>
	</ButtonGroup>
);
