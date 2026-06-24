import { flushSync } from 'react-dom';
import { createRoot, hydrateRoot } from 'react-dom/client';

const internalsKey = '_reactInternals';

// HostComponent fiber tag, represents a DOM element like <div>.
const HostComponent = 5;
const HostText = 6;

function findCurrentFiber( fiber ) {
	if ( ! fiber.alternate ) {
		// First mount — only one version exists, and it's current.
		return fiber;
	}

	// Walk up to the HostRoot to figure out which tree this fiber is on.
	let node = fiber;
	while ( node.return ) {
		node = node.return;
	}

	// The root's stateNode.current points to the current tree's root fiber.
	if ( node.stateNode.current === node ) {
		// We walked up the current tree, so `fiber` is already current.
		return fiber;
	}

	// We walked up the alternate tree — switch to the current version.
	return fiber.alternate;
}

function findHostFiber( fiber ) {
	const current = findCurrentFiber( fiber );
	if ( ! current ) {
		return null;
	}
	return findHostFiberImpl( current );
}

function findHostFiberImpl( fiber ) {
	if ( fiber.tag === HostComponent || fiber.tag === HostText ) {
		return fiber;
	}

	let child = fiber.child;
	while ( child ) {
		const hostFiber = findHostFiberImpl( child );
		if ( hostFiber ) {
			return hostFiber;
		}
		child = child.sibling;
	}

	return null;
}

export function findDOMNode( instance ) {
	if ( instance === null || instance === undefined ) {
		return null;
	}

	if ( instance.nodeType !== undefined ) {
		return instance;
	}

	const fiber = instance[ internalsKey ];
	if ( fiber === undefined ) {
		if ( typeof instance.render === 'function' ) {
			throw new Error( 'Unable to find node on an unmounted component.' );
		}
		const keys = Object.keys( instance ).join( ',' );
		throw new Error(
			`Argument appears to not be a ReactComponent. Keys: ${ keys }`
		);
	}

	const hostFiber = findHostFiber( fiber );
	return hostFiber?.stateNode ?? null;
}

const roots = new WeakMap();

export function render( element, container, callback ) {
	let root = roots.get( container );
	if ( ! root ) {
		root = createRoot( container );
		roots.set( container, root );
	}

	flushSync( () => {
		root.render( element );
	} );

	if ( typeof callback === 'function' ) {
		callback();
	}
}

export function hydrate( element, container, callback ) {
	let root = roots.get( container );
	if ( ! root ) {
		root = hydrateRoot( container, element );
		roots.set( container, root );
	} else {
		root.render( element );
	}

	if ( typeof callback === 'function' ) {
		callback();
	}
}

export function unmountComponentAtNode( container ) {
	const root = roots.get( container );
	if ( ! root ) {
		return false;
	}

	flushSync( () => {
		root.unmount();
	} );
	roots.delete( container );
	return true;
}
