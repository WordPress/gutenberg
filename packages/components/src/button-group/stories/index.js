/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

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
			<Button isPrimary style={ style }>
				Button 1
			</Button>
			<Button isPrimary style={ style }>
				Button 2
			</Button>
		</ButtonGroup>
	);
};

const ButtonGroupWithState = () => {
	const [ checked, setChecked ] = useState( 'medium' );
	return (
		<ButtonGroup mode="radio" onChange={ setChecked } checked={ checked }>
			<Button value="small">Small</Button>
			<Button value="medium">Medium</Button>
			<Button value="large">Large</Button>
		</ButtonGroup>
	);
};

export const radioButtonGroup = () => {
	return <ButtonGroupWithState />;
};
