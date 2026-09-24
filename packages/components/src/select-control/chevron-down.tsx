import { chevronDown, Icon } from '@wordpress/icons';
import {
	chevronIconSize,
	DownArrowWrapper,
	InputControlSuffixWrapperWithClickThrough,
} from './styles/select-control-styles';

const SelectControlChevronDown = () => {
	return (
		<InputControlSuffixWrapperWithClickThrough>
			<DownArrowWrapper>
				<Icon icon={ chevronDown } size={ chevronIconSize } />
			</DownArrowWrapper>
		</InputControlSuffixWrapperWithClickThrough>
	);
};

export default SelectControlChevronDown;
