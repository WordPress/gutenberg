import deprecated from '@wordpress/deprecated';

const internalsKey = '_reactInternals';

// HostComponent fiber tag, represents a DOM element like <div>.
const HostComponent = 5;
const HostText = 6;

function findHostFiber( fiber: any ): any {
	if ( fiber.tag === HostComponent || fiber.tag === HostText ) {
		return fiber;
	}

	let child = fiber.child;
	while ( child ) {
		const hostFiber = findHostFiber( child );
		if ( hostFiber ) {
			return hostFiber;
		}
		child = child.sibling;
	}

	return null;
}

/**
 * Finds the DOM node of a React component instance.
 *
 * @deprecated since WordPress 6.2.0. Use DOM refs instead.
 * @see https://react.dev/reference/react-dom/findDOMNode
 *
 * @param      instance Component's instance.
 */
export default function findDOMNode(
	instance: React.ReactInstance
): Element | Text | null {
	deprecated( 'wp.element.findDOMNode', {
		since: '6.2',
		alternative: 'DOM refs',
		link: 'https://react.dev/reference/react-dom/findDOMNode',
	} );

	const fiber = instance?.[ internalsKey ];
	if ( ! fiber ) {
		return null;
	}
	const hostFiber = findHostFiber( fiber );
	return hostFiber?.stateNode ?? null;
}
