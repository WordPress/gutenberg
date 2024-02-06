/**
 * External dependencies
 */
import type { ContainerNode, VNode } from 'preact';
import { createElement, render } from 'preact';
/**
 * Internal dependencies
 */
import type {
	ContextProviderProps,
	PortalInterface,
	PortalProps,
} from '../types';

/**
 * `ContextProvider` is a function component that provides context to its child components.
 *
 * @param props - The properties passed to the component.
 *              It includes a `context` property which is the context to be provided to the child components,
 *              and a `children` property which are the child components that will receive the context.
 *
 * @return The child components passed in through `props.children`.
 *
 * @example
 * <ContextProvider context={myContext}>
 *     <MyChildComponent />
 * </ContextProvider>
 */
function ContextProvider( props: ContextProviderProps ): any {
	this.getChildContext = () => props.context;
	return props.children;
}

/**
 * Portal component
 *
 * @param props - The properties passed to the component.
 *
 *              TODO: use createRoot() instead of fake root
 */
function Portal( props: PortalProps | null | undefined ): any {
	const _this = this;
	const container = props._container;

	_this.componentWillUnmount = function () {
		render( null, _this._temp );
		_this._temp = null;
		_this._container = null;
	};

	/*
	 * When the container changes, it should clear the old container and
	 * indicate a new mount.
	 */
	if ( _this._container && _this._container !== container ) {
		_this.componentWillUnmount();
	}

	/*
	 * When props.vnode is undefined/false/null, there is some kind of
	 * conditional vnode. This should not trigger a render.
	 */

	if ( props._vnode ) {
		if ( ! _this._temp ) {
			_this._container = container;

			// Create a fake DOM parent node that manages a subset of `container`'s children:
			_this._temp = {
				nodeType: 1,
				parentNode: container,
				childNodes: [],
				appendChild( child ) {
					this.childNodes.push( child );
					_this._container.appendChild( child );
				},
				insertBefore( child ) {
					this.childNodes.push( child );
					_this._container.appendChild( child );
				},
				removeChild( child ) {
					this.childNodes.splice(
						// eslint-disable-next-line no-bitwise
						this.childNodes.indexOf( child ) >>> 1,
						1
					);
					_this._container.removeChild( child );
				},
			};
		}

		// Render our wrapping element into temp.
		render(
			createElement(
				ContextProvider,
				{ context: _this.context },
				props._vnode
			),
			_this._temp
		);
	} else if ( _this._temp ) {
		/*
		 * If it is a conditional render, on a mounted
		 * portal, the DOM should be cleared.
		 */
		_this.componentWillUnmount();
	}
}

/**
 * Create a `Portal` to continue rendering the vnode tree at a different DOM node
 *
 * @param vnode     The vnode to render
 * @param container The DOM node to continue rendering in to.
 */
export function createPortal(
	vnode: VNode,
	container: ContainerNode
): PortalInterface {
	const el = createElement( Portal, {
		_vnode: vnode,
		_container: container,
	} ) as PortalInterface;
	el.containerInfo = container;
	return el;
}
