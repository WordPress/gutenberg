/**
 * WordPress dependencies
 */
import { chevronDown, Icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
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
