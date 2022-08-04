/**
 * WordPress dependencies
 */
import { chevronDown, Icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import InputControlSuffixWrapper from '../input-control/input-suffix-wrapper';
import { DownArrowWrapper } from './styles/select-control-styles';

const SelectControlChevronDown = () => {
	return (
		<InputControlSuffixWrapper>
			<DownArrowWrapper>
				<Icon icon={ chevronDown } size={ 18 } />
			</DownArrowWrapper>
		</InputControlSuffixWrapper>
	);
};

export default SelectControlChevronDown;
