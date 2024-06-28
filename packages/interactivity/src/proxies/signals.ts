/**
 * External dependencies
 */
import {
	computed,
	signal,
	batch,
	type Signal,
	type ReadonlySignal,
} from '@preact/signals-core';

/**
 * Internal dependencies
 */
import { getProxyNs } from './registry';
import { getScope, setNamespace, resetNamespace } from '../hooks';
import { withScope } from '../utils';

const NO_SCOPE = Symbol();

export class PropSignal {
	public readonly namespace: string;
	private owner: object;
	private computedsByScope: WeakMap< WeakKey, ReadonlySignal >;
	private valueSignal?: Signal;
	private getterSignal?: Signal< ( () => any ) | undefined >;

	constructor( owner: object ) {
		this.owner = owner;
		this.namespace = getProxyNs( owner )!;
		this.computedsByScope = new WeakMap();
	}

	public setValue( value: unknown ): PropSignal {
		return this.update( { value } );
	}

	public setGetter( getter: () => any ): PropSignal {
		return this.update( { get: getter } );
	}

	public getComputed(): ReadonlySignal {
		const scope = getScope() || NO_SCOPE;

		if ( ! this.valueSignal && ! this.getterSignal ) {
			this.update( {} );
		}

		if ( ! this.computedsByScope.has( scope ) ) {
			const callback = () => {
				const getter = this.getterSignal?.value;
				return getter
					? getter.call( this.owner )
					: this.valueSignal?.value;
			};

			setNamespace( this.namespace );
			this.computedsByScope.set(
				scope,
				computed( withScope( callback ) )
			);
			resetNamespace();
		}

		return this.computedsByScope.get( scope )!;
	}

	public peekValueSignal(): unknown {
		return this.valueSignal?.peek();
	}

	private update( {
		get,
		value,
	}: {
		get?: () => any;
		value?: unknown;
	} ): PropSignal {
		if ( ! this.valueSignal ) {
			this.valueSignal = signal( value );
			this.getterSignal = signal( get );
		} else if (
			value !== this.valueSignal.peek() ||
			get !== this.getterSignal?.peek()
		) {
			batch( () => {
				this.valueSignal!.value = value;
				this.getterSignal!.value = get;
			} );
		}
		return this;
	}
}
