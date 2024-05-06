/**
 * External dependencies
 */
import clsx from 'clsx';

export default function NavigableRegion( {
	children,
	className,
	ariaLabel,
	as: Tag = 'div',
	...props
} ) {
	return (
		<Tag
			className={ clsx( 'interface-navigable-region', className ) }
			aria-label={ ariaLabel }
			role="region"
			tabIndex="-1"
			{ ...props }
		>
			{ children }
		</Tag>
	);
}
