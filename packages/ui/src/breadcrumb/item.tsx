import clsx from 'clsx';
import type { ReactNode } from 'react';
import defenseStyles from '../utils/css/global-css-defense.module.css';
import styles from './style.module.css';

type ItemProps = {
	children: ReactNode;
	className?: string;
	measurement?: boolean;
};

function Item( { children, className, measurement = false }: ItemProps ) {
	const mergedClassName = clsx(
		defenseStyles.li,
		styles.item,
		measurement && styles[ 'measurement-item' ],
		className
	);

	if ( measurement ) {
		return <span className={ mergedClassName }>{ children }</span>;
	}

	return <li className={ mergedClassName }>{ children }</li>;
}

export { Item };
