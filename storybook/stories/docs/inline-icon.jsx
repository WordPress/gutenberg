import clsx from 'clsx';
import styles from './inline-icon.module.scss';

export const InlineIcon = ( { icon, className, ...props } ) => {
	const IconComponent = icon;
	return (
		<IconComponent
			aria-hidden
			className={ clsx( styles.icon, className ) }
			{ ...props }
		/>
	);
};
