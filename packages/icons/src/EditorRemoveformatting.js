
/**
 * WordPress dependencies
 */
import { primitives } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

const { Path, SVG } = primitives;

export default function EditorRemoveformatting( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'editor-removeformatting', className, ariaPressed );
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
			<Path d="M14.29 4.59l1.1 1.11c.41.4.61.94.61 1.47v2.12c0 .53-.2 1.07-.61 1.47l-6.63 6.63c-.4.41-.94.61-1.47.61s-1.07-.2-1.47-.61l-1.11-1.1-1.1-1.11c-.41-.4-.61-.94-.61-1.47v-2.12c0-.54.2-1.07.61-1.48l6.63-6.62c.4-.41.94-.61 1.47-.61s1.06.2 1.47.61zm-6.21 9.7l6.42-6.42c.39-.39.39-1.03 0-1.43L12.36 4.3c-.19-.19-.45-.29-.72-.29s-.52.1-.71.29l-6.42 6.42c-.39.4-.39 1.04 0 1.43l2.14 2.14c.38.38 1.04.38 1.43 0z" />
		</SVG>
	);
}
