/**
 * Internal dependencies
 */
import { useControlGroupContext } from './utils';
import { ControlGroupItemView } from './styles/control-group-styles';

function ControlGroupItem( props ) {
	const { isFirst, isOnly } = useControlGroupContext();

	return (
		<ControlGroupItemView
			isFirst={ isFirst }
			isOnly={ isOnly }
			{ ...props }
		/>
	);
}

export default ControlGroupItem;
