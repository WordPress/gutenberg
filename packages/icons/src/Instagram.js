
/**
 * WordPress dependencies
 */
import { primitives } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

const { Path, SVG } = primitives;

export default function Instagram( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'instagram', className, ariaPressed );
	return (
		<SVG
			aria-hidden
			role="img"
			focusable="false"
			className={ iconClass }
			xmlns="http://www.w3.org/2000/svg"
			width={ size }
			height={ size }
			viewBox="0 0 20 20"
			{ ...props }
		>
			<Path d="M12.67 10A2.67 2.67 0 1 0 10 12.67 2.68 2.68 0 0 0 12.67 10zm1.43 0A4.1 4.1 0 1 1 10 5.9a4.09 4.09 0 0 1 4.1 4.1zm1.13-4.27a1 1 0 1 1-1-1 1 1 0 0 1 1 1zM10 3.44c-1.17 0-3.67-.1-4.72.32a2.67 2.67 0 0 0-1.52 1.52c-.42 1-.32 3.55-.32 4.72s-.1 3.67.32 4.72a2.74 2.74 0 0 0 1.52 1.52c1 .42 3.55.32 4.72.32s3.67.1 4.72-.32a2.83 2.83 0 0 0 1.52-1.52c.42-1.05.32-3.55.32-4.72s.1-3.67-.32-4.72a2.74 2.74 0 0 0-1.52-1.52c-1.05-.42-3.55-.32-4.72-.32zM18 10c0 1.1 0 2.2-.05 3.3a4.84 4.84 0 0 1-1.29 3.36A4.8 4.8 0 0 1 13.3 18H6.7a4.84 4.84 0 0 1-3.36-1.29 4.84 4.84 0 0 1-1.29-3.41C2 12.2 2 11.1 2 10V6.7a4.84 4.84 0 0 1 1.34-3.36A4.8 4.8 0 0 1 6.7 2.05C7.8 2 8.9 2 10 2h3.3a4.84 4.84 0 0 1 3.36 1.29A4.8 4.8 0 0 1 18 6.7V10z" />
		</SVG>
	);
}
