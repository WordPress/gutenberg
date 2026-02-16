/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { Children } from '@wordpress/element';

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
			role="group"
			className={ clsx( 'components-avatar-group', className ) }
			{ ...props }
		>
			{ visible }
			{ overflowCount > 0 && (
				<span
					className="components-avatar-group__overflow"
					aria-label={ `${ overflowCount } more` }
				>
					{ `+${ overflowCount }` }
				</span>
			) }
		</div>
	);
}

export default AvatarGroup;
