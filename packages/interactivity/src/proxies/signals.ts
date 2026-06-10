/**
 * External dependencies
 */
import {
	computed,
	signal,
	batch,
	type Signal,
	type ReadonlySignal,
} from '@preact/signals';

/**
 * Internal dependencies
 */
import { getNamespaceFromProxy } from './registry';
import { getScope } from '../scopes';
import { setNamespace, resetNamespace } from '../namespaces';
import { withScope } from '../utils';

/**
 * Identifier for property computeds not associated to any scope.
 */
const NO_SCOPE = {};

/**
 * Structure that manages reactivity for a property in a state object. It uses
 * signals to keep track of property value or getter modifications.
 */
export class PropSignal {
	/**
	 * Proxy that holds the property this PropSignal is associated with.
	 */
	private owner: object;

	/**
	 * Relation of computeds by scope. These computeds are read-only signals
	 * that depend on whether the property is a value or a getter and,
	 * therefore, can return different values depending on the scope in which
	 * the getter is accessed.
	 */
	private computedsByScope: WeakMap< WeakKey, ReadonlySignal >;

	/**
	 * Signal with the value assigned to the related property.
	 */
	private valueSignal?: Signal;

	/**
	 * Signal with the getter assigned to the related property.
	 */
	private getterSignal?: Signal< ( () => any ) | undefined >;

	/**
	 * Pending getter to be consolidated.
	 */
	private pendingGetter?: () => any;

	/**
	 * Structure that manages reactivity for a property in a state object, using
	 * signals to keep track of property value or getter modifications.
	 *
	 * @param owner Proxy that holds the property this instance is associated
	 *              with.
	 */
	constructor( owner: object ) {
		this.owner = owner;
		this.computedsByScope = new WeakMap();
	}

	/**
	 * Changes the internal value. If a getter was set before, it is set to
	 * `undefined`.
	 *
	 * @param value New value.
	 */
	public setValue( value: unknown ) {
		this.update( { value } );
	}

	/**
	 * Changes the internal getter. If a value was set before, it is set to
	 * `undefined`.
	 *
	 * @param getter New getter.
	 */
	public setGetter( getter: () => any ) {
		this.update( { get: getter } );
	}

	/**
	 * Changes the internal getter asynchronously.
	 *
	 * The update is made in a microtask, which prevents issues with getters
	 * accessing the state, and ensures the update occurs before any render.
	 *
	 * @param getter New getter.
	 */
	public setPendingGetter( getter: () => any ) {
		this.pendingGetter = getter;
		queueMicrotask( () => this.consolidateGetter() );
	}

	/**
	 * Consolidate the pending value of the getter.
	 */
	private consolidateGetter() {
		const getter = this.pendingGetter;
		if ( getter ) {
			this.pendingGetter = undefined;
			this.update( { get: getter } );
		}
	}

	/**
	 * Returns the computed that holds the result of evaluating the prop in the
	 * current scope.
	 *
	 * These computeds are read-only signals that depend on whether the property
	 * is a value or a getter and, therefore, can return different values
	 * depending on the scope in which the getter is accessed.
	 *
	 * @return Computed that depends on the scope.
	 */
	public getComputed(): ReadonlySignal {
		const scope = getScope() || NO_SCOPE;

		if ( ! this.valueSignal && ! this.getterSignal ) {
			this.update( {} );
		}

		/*
		 * If there is any pending getter, consolidate it first. This
		 * could happen if a getter is accessed synchronously after
		 * being set with `store()`.
		 */
		if ( this.pendingGetter ) {
			this.consolidateGetter();
		}

		if ( ! this.computedsByScope.has( scope ) ) {
			const callback = () => {
				const getter = this.getterSignal?.value;
				return getter
					? getter.call( this.owner )
					: this.valueSignal?.value;
			};

			setNamespace( getNamespaceFromProxy( this.owner ) );
			this.computedsByScope.set(
				scope,
				computed( withScope( callback ) )
			);
			resetNamespace();
		}

		return this.computedsByScope.get( scope )!;
	}

	/**
	 *  Updates the internal signals for the value and the getter of the
	 *  corresponding prop.
	 *
	 * @param param0
	 * @param param0.get   New getter.
	 * @param param0.value New value.
	 */
	private update( { get, value }: { get?: () => any; value?: unknown } ) {
		if ( ! this.valueSignal ) {
			this.valueSignal = signal( value );
			this.getterSignal = signal( get );
		} else if (
			value !== this.valueSignal.peek() ||
			get !== this.getterSignal!.peek()
		) {
			batch( () => {
				this.valueSignal!.value = value;
				this.getterSignal!.value = get;
			} );
		}
	}
}
