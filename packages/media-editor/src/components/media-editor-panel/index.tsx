import fastDeepEqual from 'fast-deep-equal/es6/index.js';
import { Fill } from '@wordpress/components';
import {
	createContext,
	useCallback,
	useContext,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import warning from '@wordpress/warning';
import type { ReactNode } from 'react';
import { MEDIA_TYPES, type MediaType } from '../../utils';
import MediaEditorPanelErrorBoundary from './error-boundary';

/** What the sidebar hands a panel when it renders it. */
export interface MediaEditorPanelFillProps {
	/** `true` while a save is running; panels disable their controls. */
	disabled: boolean;
}

/** What the sidebar needs to know about a panel to give it a tab. */
export interface MediaEditorPanelRegistration {
	/** Unique, namespaced name, for example `core/crop`. */
	name: string;
	/** Tab label. */
	title: string;
	/**
	 * Sort order among panels, ascending; ties sort by name. Core's Crop
	 * is 10 and Details 20, so a panel without an order follows them.
	 *
	 * @default 100
	 */
	order?: number;
	/**
	 * Media types the panel applies to. Omitted means every type. Core's
	 * Crop panel is for images only.
	 */
	mediaTypes?: readonly MediaType[ 'type' ][];
}

export interface MediaEditorPanelProps extends MediaEditorPanelRegistration {
	/** The panel's content, or a function of what the sidebar passes it. */
	children:
		ReactNode | ( ( fillProps: MediaEditorPanelFillProps ) => ReactNode );
}

interface MediaEditorPanelsContextValue {
	register: ( panel: MediaEditorPanelRegistration, instance: object ) => void;
	unregister: ( name: string, instance: object ) => void;
	/** The mounted panel that holds each name. */
	owners: Record< string, object >;
}

const MediaEditorPanelsContext =
	createContext< MediaEditorPanelsContextValue | null >( null );

export const MediaEditorPanelsProvider = MediaEditorPanelsContext.Provider;

const DEFAULT_ORDER = 100;

/**
 * The `registerPlugin` scope the editor mounts. A plugin registered with it
 * renders inside the editor's session, where it can render a panel.
 */
export const MEDIA_EDITOR_PLUGIN_SCOPE = 'media-editor';

/** `vendor/panel`: lowercase letters, digits and dashes, with one slash. */
const PANEL_NAME_PATTERN = /^[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*$/;

/**
 * The slot a panel's content fills, so the sidebar can render it as a
 * tab body.
 *
 * @param name The panel's name.
 * @return The slot name.
 */
export function getPanelSlotName( name: string ) {
	return `MediaEditorPanel/${ name }`;
}

/**
 * Owns the list of mounted panels for one editor. The editor provides
 * the returned context value so `MediaEditorPanel` instances anywhere in
 * its tree, Core's and plugins', can announce themselves; it reads
 * `panels` to build the sidebar's tabs.
 *
 * @return The mounted panels, sorted, and the context value to provide.
 */
export function useMediaEditorPanels() {
	const [ panels, setPanels ] = useState<
		Record<
			string,
			{ registration: MediaEditorPanelRegistration; owner: object }
		>
	>( {} );
	// Which mounted panel holds each name. The first panel to announce a name
	// keeps it; another one with the same name stays hidden until the first
	// unmounts. A ref, so panels announcing in the same commit see each other.
	const ownersRef = useRef( new Map< string, object >() );
	const register = useCallback(
		( panel: MediaEditorPanelRegistration, instance: object ) => {
			const owner = ownersRef.current.get( panel.name );
			if ( owner && owner !== instance ) {
				warning(
					`A media editor panel named "${ panel.name }" is already registered, so this one is not shown. Give each panel a unique name.`
				);
				return;
			}
			ownersRef.current.set( panel.name, instance );
			setPanels( ( current ) => {
				// Re-announcing unchanged details is a no-op, so a panel that
				// passes a fresh `mediaTypes` array on every render does not
				// re-render the editor, which would re-render the panel, and
				// so on.
				const entry = current[ panel.name ];
				if (
					entry?.owner === instance &&
					fastDeepEqual( entry.registration, panel )
				) {
					return current;
				}
				return {
					...current,
					[ panel.name ]: { registration: panel, owner: instance },
				};
			} );
		},
		[]
	);
	const unregister = useCallback( ( name: string, instance: object ) => {
		if ( ownersRef.current.get( name ) !== instance ) {
			return;
		}
		ownersRef.current.delete( name );
		setPanels( ( current ) => {
			if ( ! Object.hasOwn( current, name ) ) {
				return current;
			}
			const next = { ...current };
			delete next[ name ];
			return next;
		} );
	}, [] );
	const owners = useMemo(
		() =>
			Object.fromEntries(
				Object.entries( panels ).map( ( [ name, { owner } ] ) => [
					name,
					owner,
				] )
			),
		[ panels ]
	);
	const contextValue = useMemo(
		() => ( { register, unregister, owners } ),
		[ register, unregister, owners ]
	);
	const sorted = useMemo(
		() =>
			Object.values( panels )
				.map( ( { registration } ) => registration )
				.sort( ( a, b ) => {
					const byOrder =
						( a.order ?? DEFAULT_ORDER ) -
						( b.order ?? DEFAULT_ORDER );
					return byOrder !== 0
						? byOrder
						: a.name.localeCompare( b.name );
				} ),
		[ panels ]
	);
	return { panels: sorted, contextValue };
}

/**
 * A sidebar panel of the media editor. Announces itself to the editor
 * while mounted, so the sidebar shows a tab for it, and fills that tab
 * with its children. Core's Crop and Details panels are rendered with
 * this component; a plugin renders it from a `registerPlugin` callback
 * in the `media-editor` scope, where `useMediaEditorPanelContext()` gives
 * it what a panel may read and do. Content that throws stays inside its
 * tab, which names the failed panel; the rest of the editor keeps working.
 *
 * @param props
 * @param props.name
 * @param props.title
 * @param props.order
 * @param props.mediaTypes
 * @param props.children
 */
export default function MediaEditorPanel( {
	name,
	title,
	order,
	mediaTypes,
	children,
}: MediaEditorPanelProps ) {
	const context = useContext( MediaEditorPanelsContext );
	if ( ! context ) {
		throw new Error(
			`MediaEditorPanel is rendered outside the media editor. A plugin registers its panel with scope "${ MEDIA_EDITOR_PLUGIN_SCOPE }" so the editor mounts it: registerPlugin( name, { scope: "${ MEDIA_EDITOR_PLUGIN_SCOPE }", render } ).`
		);
	}
	const { register, unregister, owners } = context;
	// A token for this mounted panel, stable for its lifetime.
	const [ instance ] = useState( () => ( {} ) );
	const owner = owners[ name ];
	// Layout effects, so the tab exists before the sidebar paints; the
	// editor's first render otherwise shows an empty sidebar for a frame.
	// Announcing and withdrawing are separate effects: the details may
	// change on any render, but the tab only goes when the panel unmounts
	// or changes its name.
	useLayoutEffect( () => {
		// The mistakes that would otherwise fail silently, in development.
		if ( ! PANEL_NAME_PATTERN.test( name ) ) {
			warning(
				`The media editor panel name "${ name }" should be namespaced, like "my-plugin/my-panel": lowercase letters, digits and dashes, with one slash.`
			);
		}
		mediaTypes?.forEach( ( type ) => {
			if ( ! MEDIA_TYPES.includes( type ) ) {
				warning(
					`The media editor panel "${ name }" lists the media type "${ type }", which the editor does not know, so the panel would never show for it. Known types: ${ MEDIA_TYPES.join( ', ' ) }.`
				);
			}
		} );
		register( { name, title, order, mediaTypes }, instance );
		// `owner` re-runs this when the panel holding the name unmounts, so a
		// hidden panel with the same name takes the tab over.
	}, [ name, title, order, mediaTypes, register, owner, instance ] );
	useLayoutEffect( () => {
		return () => unregister( name, instance );
	}, [ name, unregister, instance ] );

	if ( owner !== instance ) {
		return null;
	}

	return (
		<Fill name={ getPanelSlotName( name ) }>
			{ ( fillProps ) => (
				<MediaEditorPanelErrorBoundary title={ title }>
					<MediaEditorPanelContent
						// The slot passes exactly these props; `Fill` types them loosely.
						fillProps={ fillProps as MediaEditorPanelFillProps }
					>
						{ children }
					</MediaEditorPanelContent>
				</MediaEditorPanelErrorBoundary>
			) }
		</Fill>
	);
}

/**
 * Calls a function child while rendering, inside the error boundary, so a
 * function that throws is caught there like any other content.
 *
 * @param props
 * @param props.fillProps
 * @param props.children
 */
function MediaEditorPanelContent( {
	fillProps,
	children,
}: {
	fillProps: MediaEditorPanelFillProps;
	children: MediaEditorPanelProps[ 'children' ];
} ) {
	return typeof children === 'function' ? children( fillProps ) : children;
}
