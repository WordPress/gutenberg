import { search } from '@wordpress/icons';
import { Icon } from '../../../icon';
import { InputLayout } from '../input-layout';
import styles from './style.module.css';

/**
 * The search icon prefix shared by search fields such as `SearchInput` and
 * `Combobox.Input`.
 */
export function SearchIconSlot() {
	return (
		<InputLayout.Slot padding="minimal">
			<Icon icon={ search } className={ styles[ 'search-icon' ] } />
		</InputLayout.Slot>
	);
}
