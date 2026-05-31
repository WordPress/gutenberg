/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { Icon } from '@wordpress/icons';

interface IconWithCurrentColorProps {
	icon: any;
	className?: string;
	size?: number;
	[ key: string ]: any;
}

export function IconWithCurrentColor( {
	className,
	...props
}: IconWithCurrentColorProps ) {
	return (
		<Icon
			className={ clsx(
				className,
				'global-styles-ui-icon-with-current-color'
			) }
			{ ...props }
		/>
	);
}
