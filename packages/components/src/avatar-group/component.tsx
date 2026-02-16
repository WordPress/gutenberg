/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { Children, cloneElement, isValidElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { AvatarGroupProps } from './types';
import type { WordPressComponentProps } from '../context';

function AvatarGroup( {
	className,
	max = 3,
	children,
	...props
}: WordPressComponentProps< AvatarGroupProps, 'div', false > ) {
	const childArray = Children.toArray( children );
	const visible = childArray.slice( 0, max );
	const overflowCount = childArray.length - max;

	return (
		<div
			className={ clsx( 'components-avatar-group', className ) }
			{ ...props }
		>
			{ visible.map( ( child, index ) =>
				isValidElement( child )
					? cloneElement( child, {
							style: {
								...( (
									child.props as {
										style?: React.CSSProperties;
									}
								 ).style ?? {} ),
								zIndex: visible.length - index,
							},
					  } )
					: child
			) }
			{ overflowCount > 0 && (
				<span className="components-avatar-group__overflow">
					{ `+${ overflowCount }` }
				</span>
			) }
		</div>
	);
}

export default AvatarGroup;
