declare module '@wordpress/commands' {
	import type { ReduxStoreConfig, StoreDescriptor } from '@wordpress/data';

	/*
	 * `@wordpress/commands` is currently authored as JavaScript in this
	 * checkout and does not ship a TypeScript project or declaration file that
	 * `packages/boot` can reference during `tsgo --build`.
	 *
	 * Boot only imports the public `store` export so the Site Hub search button
	 * can call `useDispatch( commandsStore ).open()`. This ambient declaration
	 * intentionally types only that small surface instead of pretending the full
	 * commands package is typed.
	 *
	 * The generic needs to be a real `ReduxStoreConfig`, not just a string,
	 * because `@wordpress/data` uses the store descriptor's config to infer
	 * dispatchable actions from `useDispatch( store )`.
	 */
	export const store: StoreDescriptor<
		ReduxStoreConfig<
			unknown,
			{
				open: () => unknown;
			},
			unknown
		>
	>;
}
