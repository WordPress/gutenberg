import { cloneElement as reactCloneElement } from 'react';
import { warnCompat } from './warn-compat';

const LEGACY_ELEMENT_TYPE = Symbol.for( 'react.element' );

// When presented with a React 18 legacy element, don't upgrade it to the React 19 shape,
// but preserve the original shape.
export function cloneElement( element, ...args ) {
	const clone = reactCloneElement( element, ...args );

	if ( element?.$$typeof !== LEGACY_ELEMENT_TYPE ) {
		return clone;
	}

	warnCompat(
		'legacy-element-clone',
		'An element created by an older React runtime (React 17/18) was passed to `React.cloneElement` and was handled by a compatibility polyfill. This usually means a bundled package ships its own React; align it with React 19.'
	);

	// The shapes differ in where the ref lives: React 19 keeps it in `props`,
	// while React 17/18 keep it on the element and never in `props`. So a ref
	// passed to `cloneElement` arrives in the clone's props and has to be moved
	// back onto the element; otherwise the original element's ref carries over.
	let { props } = clone;
	let ref = props.ref;
	if ( ref === undefined ) {
		ref = element.ref;
	} else {
		// Copy lazily, since React freezes props in development builds.
		props = { ...props };
		delete props.ref;
	}

	return {
		$$typeof: LEGACY_ELEMENT_TYPE,
		type: clone.type,
		key: clone.key,
		ref: ref ?? null,
		props,
		_owner: element._owner,
	};
}
