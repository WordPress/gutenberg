/**
 * Internal dependencies
 */
import { ControlGroup } from '../control-group';
import VisuallyHidden from '../visually-hidden';

function InputGroup( { children, legend } ) {
	return (
		<fieldset>
			<VisuallyHidden as="legend">{ legend }</VisuallyHidden>
			<ControlGroup className="components-color-picker__inputs-fields">
				{ children }
			</ControlGroup>
		</fieldset>
	);
}

export default InputGroup;
