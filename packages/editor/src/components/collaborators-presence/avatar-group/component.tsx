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

function AvatarGroup( {
	className,
	max = 3,
	children,
	...props
}: AvatarGroupProps &
	Omit< React.HTMLAttributes< HTMLDivElement >, keyof AvatarGroupProps > ) {
	const childArray = Children.toArray( children );
	const visible = childArray.slice( 0, max );
	const overflowCount = childArray.length - max;

	return (
		<div
			role="group"
			className={ clsx( 'editor-avatar-group', className ) }
			{ ...props }
		>
			{ visible }
			{ overflowCount > 0 && (
				<span
					className="editor-avatar-group__overflow"
					aria-label={ `${ overflowCount } more` }
				>
					{ `+${ overflowCount }` }
				</span>
			) }
		</div>
	);
}

export default AvatarGroup;
