/**
 * Internal dependencies
 */
import ControlGroup from '../';
import ControlGroupItem from '../item';
import InputControl from '../../input-control';

export default { title: 'Components/ControlGroup', component: ControlGroup };

export const _default = () => {
	return (
		<ControlGroup style={ { maxWidth: 200 } }>
			<ControlGroupItem isBlock>
				<InputControl value="Input" />
			</ControlGroupItem>
			<ControlGroupItem isBlock>
				<InputControl value="Input" />
			</ControlGroupItem>
		</ControlGroup>
	);
};
