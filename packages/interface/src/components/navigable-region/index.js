/**
 * External dependencies
 */
import classnames from 'classnames';

export default function NavigableRegion( {
	children,
	className,
	ariaLabel,
	as: Tag = 'div',
	...props
} ) {
	return (
		<Tag
			className={ classnames( 'interface-navigable-region', className ) }
			aria-label={ ariaLabel }
			role="region"
			tabIndex="-1"
			{ ...props }
		>
			{ children }
		</Tag>
	);
}
