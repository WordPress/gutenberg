/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { Placeholder } from '@wordpress/components';

export default function BlockMediaPlaceholder( {
	className,
	children,
	...props
} ) {
	return (
		<Placeholder
			className={ clsx( 'block-editor-media-placeholder', className ) }
			{ ...props }
		>
			{ children }
		</Placeholder>
	);
}
