import clsx from 'clsx';
import { Stack } from '@wordpress/ui';

export function FloatingContainer( {
	floating,
	className,
	style,
	children,
	...props
} ) {
	const isFloating = !! floating;
	return (
		<Stack
			direction="column"
			className={ clsx( className, { 'is-floating': isFloating } ) }
			ref={ isFloating ? floating.ref : undefined }
			style={
				isFloating
					? {
							top: floating.y,
							// Threads mount before the first measurement. Not
							// `visibility`, which would block focusing the new note form.
							opacity: floating.y === undefined ? 0 : undefined,
							...style,
						}
					: style
			}
			{ ...props }
		>
			{ children }
		</Stack>
	);
}
