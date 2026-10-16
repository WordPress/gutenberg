import clsx from 'clsx';
import type { ReactNode } from 'react';

interface ColorIndicatorWrapperProps {
	className?: string;
	children?: ReactNode;
}

function ColorIndicatorWrapper( {
	className,
	children,
}: ColorIndicatorWrapperProps ) {
	return (
		<div
			className={ clsx(
				'global-styles-ui__color-indicator-wrapper',
				className
			) }
		>
			{ children }
		</div>
	);
}

export default ColorIndicatorWrapper;
