import { search } from '@wordpress/icons';
import { Icon } from '../icon';
import { InputLayout } from '../form/primitives/input-layout';
import styles from './css/search-icon-slot.module.css';

export function SearchIconSlot() {
	return (
		<InputLayout.Slot padding="minimal">
			<Icon icon={ search } className={ styles[ 'search-icon' ] } />
		</InputLayout.Slot>
	);
}
