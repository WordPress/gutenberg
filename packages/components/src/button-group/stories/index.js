/**
 * Internal dependencies
 */
import Button from '../../button';
import ButtonGroup from '../';

export default { title: 'Components|ButtonGroup', component: ButtonGroup };

export const _default = () => {
	const style = { margin: '0 4px' };
	return (
		<ButtonGroup>
			<Button isPrimary style={ style }>Button 1</Button>
			<Button isPrimary style={ style }>Button 2</Button>
		</ButtonGroup>
	);
};
