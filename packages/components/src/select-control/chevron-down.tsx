import { chevronDown, Icon } from '@wordpress/icons';
import InputControlSuffixWrapper from '../input-control/input-suffix-wrapper';
import styles from './style.module.scss';

const SelectControlChevronDown = () => {
	return (
		<InputControlSuffixWrapper className={ styles.suffix }>
			<div className={ styles[ 'down-arrow' ] }>
				<Icon icon={ chevronDown } size={ 18 } />
			</div>
		</InputControlSuffixWrapper>
	);
};

export default SelectControlChevronDown;
