import clsx from 'clsx';
import { error, published } from '@wordpress/icons';
import { Icon } from '../icon';
import { Spinner } from '../spinner';
import defenseStyles from '../utils/css/global-css-defense.module.css';
import styles from './style.module.css';
import type { ValidityIndicatorProps } from './types';

const ICON = {
	valid: published,
	invalid: error,
};

export function ValidityIndicator( {
	id,
	type,
	message,
}: ValidityIndicatorProps ) {
	return (
		<p
			id={ id }
			className={ clsx(
				defenseStyles.p,
				styles.indicator,
				styles[ `is-${ type }` ]
			) }
		>
			{ type === 'validating' ? (
				<Spinner className={ styles[ 'indicator-spinner' ] } />
			) : (
				<Icon
					className={ styles[ 'indicator-icon' ] }
					icon={ ICON[ type ] }
					size={ 16 }
					fill="currentColor"
				/>
			) }
			{ message }
		</p>
	);
}
