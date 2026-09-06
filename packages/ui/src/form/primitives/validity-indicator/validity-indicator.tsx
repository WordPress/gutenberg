import clsx from 'clsx';
import { error, published } from '@wordpress/icons';
import { Icon } from '../../../icon';
import { Spinner } from '../../../spinner';
import defenseStyles from '../../../utils/css/global-css-defense.module.css';
import styles from './style.module.css';
import type { ValidityIndicatorProps } from './types';

const ICON = {
	valid: published,
	invalid: error,
};

/**
 * Displays a validity message for a form control, with an icon matching the
 * validity state: invalid, valid, or validating (a spinner while an async
 * check is pending).
 *
 * `ControlWithError` renders it automatically; use it directly to give a
 * custom validated control the same presentation.
 */
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
