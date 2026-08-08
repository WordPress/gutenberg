import {
	createElement,
	isValidElement,
	useEffect,
	useState,
} from '@wordpress/element';
import { resolveFields } from '../field-types';
import { resolveIcon } from '../icon-resolver';
import type {
	WidgetIcon,
	WidgetModuleRecord,
	WidgetName,
	WidgetType,
} from '../types';

/*
 * Transparent stand-in for an icon reference that has not resolved yet:
 * it holds the icon slot so titles do not shift when the icon lands.
 */
const pendingIcon: WidgetIcon = createElement( 'svg', {
	viewBox: '0 0 24 24',
} );

/* `true` while records or their metadata imports are still resolving; hosts
   must not treat a widget instance as missing until it is `false`. */
type UseWidgetTypesResult = readonly [ WidgetType[], boolean ];

/**
 * Resolves widget types from host-supplied records.
 *
 * For each record it dynamically imports `widget_module` and merges the
 * module's default export with the runtime fields (`name`, `renderModule`).
 * Attribute schemas pass through `resolveFields`, so attributes referencing
 * registered field types reach hosts as plain DataViews fields. Icon
 * references resolve through the registered icon resolver, off the loading
 * flag: widget types emit as soon as their modules land, and each resolved
 * icon patches in afterwards.
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
					return null;
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

					return {
						...metadata,
						...( metadata.attributes
							? {
									attributes: resolveFields(
										metadata.attributes
									),
							  }
							: {} ),
						name: record.name as WidgetName,
						renderModule: record.render_module ?? '',
						icon,
						/*
						 * `title` is required:
						 * - Server-side title wins
						 * - Then the module's title
						 * - Then the record's name as fallback
						 */
						title: record.title ?? metadata.title ?? record.name,
						...( record.presentation
							? { presentation: record.presentation }
							: {} ),
						...( record.category
							? { category: record.category }
							: {} ),
						...( record.description
							? { description: record.description }
							: {} ),
						...( record.help ? { help: record.help } : {} ),
						...( record.keywords
							? { keywords: record.keywords }
							: {} ),
						...( record.actions
							? { actions: record.actions }
							: {} ),
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
		} );

		return () => {
			cancelled = true;
		};
	}, [ records ] );

	return [ widgetTypes, isResolvingWidgetTypes ];
}
