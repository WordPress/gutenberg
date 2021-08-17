/**
 * Internal dependencies
 */
import Button from '../../button';
import ButtonGroup from '../';

export default { title: 'Components/ButtonGroup', component: ButtonGroup };

export const _default = () => {
	const style = { margin: '0 4px' };
	return (
		<ButtonGroup>
			<Button variant="primary" style={ style }>
				Button 1
			</Button>
			<Button variant="primary" style={ style }>
				Button 2
			</Button>
		</ButtonGroup>
	);
};
