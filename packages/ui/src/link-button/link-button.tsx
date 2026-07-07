import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { Link } from '../link';
import { type LinkButtonProps } from './types';
import buttonStyles from '../button/style.module.css';
import focusStyles from '../utils/css/focus.module.css';
import styles from './style.module.css';

/**
 * A link that looks like a `Button`. Prefer `Link` for navigation unless
 * button prominence is intentional.
 *
 * See the [Usage Guidelines](https://wordpress.github.io/gutenberg/?path=/docs/design-system-components-button-usage-guidelines--docs)
 * for when to use `Button`, `IconButton`, `Link`, or `LinkButton`.
 */
export const LinkButton = forwardRef< HTMLAnchorElement, LinkButtonProps >(
	function LinkButton(
		{
			tone = 'brand',
			variant = 'solid',
			size = 'default',
			className,
			children,
			...props
		},
		ref
	) {
		return (
			<Link
				ref={ ref }
				variant="unstyled"
				className={ clsx(
					styles[ 'link-button' ],
					focusStyles[ 'outset-ring--focus-except-active' ],
					variant !== 'unstyled' && buttonStyles.button,
					buttonStyles[ `is-${ tone }` ],
					buttonStyles[ `is-${ variant }` ],
					buttonStyles[ `is-${ size }` ],
					className
				) }
				{ ...props }
			>
				{ children }
			</Link>
		);
	}
);
