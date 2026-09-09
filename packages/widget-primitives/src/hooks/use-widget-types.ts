import {
	createElement,
	isValidElement,
	useEffect,
	useState,
} from '@wordpress/element';
import { resolveFields } from '../field-types';
import { resolveIcon } from '../icon-resolver';
import type {
	WidgetAction,
	WidgetActionRecord,
	WidgetIcon,
	WidgetModuleRecord,
	WidgetName,
	WidgetType,
} from '../types';

/*
 * Transparent stand-in for an icon reference that has not resolved yet:
 * it holds the icon slot so titles do not shift and actions keep their
 * icon shape while the icon lands.
 */
const pendingIcon: WidgetIcon = createElement( 'svg', {
	viewBox: '0 0 24 24',
} );

/**
 * Emitted actions carry only renderable icons: a wire reference holds the
 * slot with the stand-in while it resolves; anything else non-renderable
 * drops.
 *
 * @param actions     Declared actions, from the record or the module.
 * @param holdPending Whether wire references resolve later (record actions).
 */
function withRenderableIcons(
	actions: ( WidgetAction | WidgetActionRecord )[],
	holdPending: boolean
): WidgetAction[] {
	return actions.map( ( { icon, ...action } ) => {
		if ( isValidElement( icon ) ) {
			return { ...action, icon: icon as WidgetIcon };
		}

		if ( holdPending && typeof icon === 'string' ) {
			return { ...action, icon: pendingIcon };
		}

		return action;
	} );
}

/* `true` while records or their metadata imports are still resolving; hosts
   must not treat a widget instance as missing until it is `false`. */
type UseWidgetTypesResult = readonly [ WidgetType[], boolean ];

/*
 * Applied when neither the record nor its metadata module declares one.
 */
const DEFAULT_API_VERSION = 1;

/*
 * The record fields that overlay a module's metadata, shared by both
 * resolution paths so they cannot drift.
 */
function recordOverlay( record: WidgetModuleRecord ) {
	return {
		name: record.name as WidgetName,
		renderModule: record.render_module ?? '',
		...( record.presentation ? { presentation: record.presentation } : {} ),
		...( record.category ? { category: record.category } : {} ),
		...( record.description ? { description: record.description } : {} ),
		...( record.help ? { help: record.help } : {} ),
		...( record.keywords ? { keywords: record.keywords } : {} ),
	};
}

/**
 * Resolves widget types from host-supplied records.
 *
 * For each record it dynamically imports `widget_module` and merges the
 * module's default export with the runtime fields (`name`, `renderModule`).
 * A record without a metadata module resolves from its own fields alone,
 * so a widget declared entirely by its manifest needs no module stub.
 * Attribute schemas pass through `resolveFields`, so attributes referencing
 * registered field types reach hosts as plain DataViews fields. Icon
 * references resolve through the registered icon resolver, off the loading
 * flag: widget types emit as soon as their modules land, and each resolved
 * icon patches in afterwards. Action icon references resolve the same way.
 * Pass `null`/`undefined` while records are still loading.
 *
 * @param records Host-supplied records, or `null`/`undefined` while loading.
 */
export function useWidgetTypes(
	records: WidgetModuleRecord[] | null | undefined
): UseWidgetTypesResult {
	const [ widgetTypes, setWidgetTypes ] = useState< WidgetType[] >( [] );
	const [ isResolvingWidgetTypes, setIsResolvingWidgetTypes ] =
		useState( true );

	useEffect( () => {
		if ( records === null || records === undefined ) {
			setIsResolvingWidgetTypes( true );
			return;
		}

		if ( records.length === 0 ) {
			setWidgetTypes( [] );
			setIsResolvingWidgetTypes( false );
			return;
		}

		let cancelled = false;
		setIsResolvingWidgetTypes( true );

		Promise.all(
			records.map( async ( record ) => {
				if ( ! record.widget_module ) {
					/*
					 * No metadata module: the widget is declared entirely
					 * by its manifest, so the record carries the metadata
					 * and the render module carries the body. Without a
					 * render module there is nothing to mount, and the
					 * record drops.
					 */
					if ( ! record.render_module ) {
						return null;
					}

					return {
						apiVersion: DEFAULT_API_VERSION,
						title: record.title ?? record.name,
						...( record.icon ? { icon: pendingIcon } : {} ),
						...( record.actions
							? {
									actions: withRenderableIcons(
										record.actions,
										true
									),
							  }
							: {} ),
						...recordOverlay( record ),
					} as WidgetType;
				}

				try {
					const module = await import(
						/* webpackIgnore: true */ record.widget_module
					);

					if ( ! module?.default ) {
						return null;
					}

					const metadata = module.default as Partial< WidgetType >;

					/*
					 * Only a renderable element may enter; a pending
					 * reference holds the slot with the stand-in until
					 * it resolves after the gate.
					 */
					const moduleIcon = isValidElement( metadata.icon )
						? metadata.icon
						: undefined;
					const icon =
						moduleIcon ?? ( record.icon ? pendingIcon : undefined );

					const actions = record.actions ?? metadata.actions;

					return {
						apiVersion: DEFAULT_API_VERSION,
						...metadata,
						...( metadata.attributes
							? {
									attributes: resolveFields(
										metadata.attributes
									),
							  }
							: {} ),
						icon,
						/*
						 * `title` is required:
						 * - Server-side title wins
						 * - Then the module's title
						 * - Then the record's name as fallback
						 */
						title: record.title ?? metadata.title ?? record.name,
						...( actions
							? {
									actions: withRenderableIcons(
										actions,
										actions === record.actions
									),
							  }
							: {} ),
						...recordOverlay( record ),
					} as WidgetType;
				} catch {
					return null;
				}
			} )
		).then( ( results ) => {
			if ( cancelled ) {
				return;
			}

			setWidgetTypes(
				results.filter( ( t ): t is WidgetType => t !== null )
			);
			setIsResolvingWidgetTypes( false );

			/*
			 * Icons resolve off the loading gate. The resolved reference
			 * wins; when it does not resolve, the module's element
			 * stands and the stand-in clears.
			 */
			for ( const record of records ) {
				if ( ! record.icon ) {
					continue;
				}

				void resolveIcon( record.icon ).then( ( resolved ) => {
					if ( cancelled ) {
						return;
					}

					setWidgetTypes( ( prev ) =>
						prev.map( ( widgetType ) => {
							if ( widgetType.name !== record.name ) {
								return widgetType;
							}

							if ( resolved ) {
								return { ...widgetType, icon: resolved };
							}

							return widgetType.icon === pendingIcon
								? { ...widgetType, icon: undefined }
								: widgetType;
						} )
					);
				} );
			}

			/*
			 * Record action icon references resolve off the gate and
			 * patch in; an unresolvable reference clears the stand-in.
			 */
			for ( const record of records ) {
				for ( const action of record.actions ?? [] ) {
					if ( typeof action.icon !== 'string' ) {
						continue;
					}

					void resolveIcon( action.icon ).then( ( resolved ) => {
						if ( cancelled ) {
							return;
						}

						setWidgetTypes( ( prev ) =>
							prev.map( ( type ) => {
								if ( type.name !== record.name ) {
									return type;
								}

								return {
									...type,
									actions: type.actions?.map( ( entry ) => {
										if ( entry.id !== action.id ) {
											return entry;
										}

										if ( resolved ) {
											return {
												...entry,
												icon: resolved,
											};
										}

										return entry.icon === pendingIcon
											? { ...entry, icon: undefined }
											: entry;
									} ),
								};
							} )
						);
					} );
				}
			}
		} );

		return () => {
			cancelled = true;
		};
	}, [ records ] );

	return [ widgetTypes, isResolvingWidgetTypes ];
}
