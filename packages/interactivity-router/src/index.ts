import { store, privateApis, getConfig } from '@wordpress/interactivity';
import { preloadStyles, applyStyles, type StyleElement } from './assets/styles';
import {
	preloadScriptModules,
	importScriptModules,
	markScriptModuleAsResolved,
	type ScriptModuleLoad,
} from './assets/script-modules';

const {
	getRegionRootFragment,
	initialVdomPromise,
	toVdom,
	parseDirectiveValue,
	render,
	parseServerData,
	populateServerData,
	batch,
	routerRegions,
	h: createElement,
	navigationSignal,
	sessionId,
	warn,
	afterNextFrame,
	getScope,
} = privateApis(
	'I acknowledge that using private APIs means my theme or plugin will inevitably break in the next version of WordPress.'
);

const regionAttr = `data-wp-router-region`;
const interactiveAttr = `data-wp-interactive`;
const regionsSelector = `[${ interactiveAttr }][${ regionAttr }], [${ interactiveAttr }] [${ interactiveAttr }][${ regionAttr }]`;

export interface NavigateOptions {
	force?: boolean;
	html?: string;
	replace?: boolean;
	timeout?: number;
	loadingAnimation?: boolean;
	screenReaderAnnouncement?: boolean;
	/**
	 * Who started this navigation, published on `state.initiator` while the
	 * navigation is in flight. A string (for example a router region id) is
	 * used as is. `null` publishes `null`. When omitted, the router derives it
	 * from the directive scope the action was called from.
	 */
	initiator?: string | null;
}

export interface PrefetchOptions {
	force?: boolean;
	html?: string;
}

interface VdomParams {
	vdom?: WeakMap< Element, any >;
}

interface Page {
	url: string;
	regions: Record< string, any >;
	regionsToAttach: Record< string, string >;
	styles: StyleElement[];
	scriptModules: ScriptModuleLoad[];
	title: string;
	initialData: any;
}

type PreparePage = (
	url: string,
	dom: Document,
	params?: VdomParams
) => Promise< Page >;

// The cache of visited and prefetched pages, stylesheets and scripts.
const pages = new Map< string, Promise< Page | false > >();

// Helper to remove domain and hash from the URL. We are only interesting in
// caching the path and the query.
const getPagePath = ( url: string ) => {
	const u = new URL( url, window.location.href );
	return u.pathname + u.search;
};

/**
 * Parses the given region's directive using the runtime's shared directive
 * value parser.
 *
 * @param region Region element.
 * @return The region `id` and optional `attachTo` selector.
 */
const parseRegionAttribute = ( region: Element ) => {
	const { value } = parseDirectiveValue(
		region.getAttribute( regionAttr ) ?? ''
	);
	if ( typeof value === 'string' ) {
		return { id: value };
	}
	return {
		id: value.id as string,
		attachTo: value.attachTo as string | undefined,
	};
};

/**
 * Extracts the region id from a `data-wp-router-region` attribute value.
 *
 * The parser returns either a string or an object with an `id` property. Only
 * a nonempty string id counts; anything else yields `null`.
 *
 * @param value The raw `data-wp-router-region` attribute value, or `null`.
 * @return The region id, or `null` when no usable id is present.
 */
const parseRegionId = ( value: string | null ): string | null => {
	if ( value === null ) {
		return null;
	}
	const { value: parsedValue } = parseDirectiveValue( value );
	const id = typeof parsedValue === 'string' ? parsedValue : parsedValue.id;
	return typeof id === 'string' && id ? id : null;
};

/**
 * Clones the content of the router region vDOM passed as argument.
 *
 * The function creates a new VNode instance removing all priority levels up to
 * the one containing the router-region directive, which should have evaluated
 * in advance.
 *
 * @param vdom A router region's VNode.
 * @return The VNode for the passed router region's content.
 */
const cloneRouterRegionContent = ( vdom: any ) => {
	if ( ! vdom ) {
		return vdom;
	}
	const allPriorityLevels: string[][] = vdom.props.priorityLevels;
	const routerRegionLevel = allPriorityLevels.findIndex( ( level ) =>
		level.includes( 'router-region' )
	);
	const priorityLevels =
		routerRegionLevel !== -1
			? allPriorityLevels.slice( routerRegionLevel + 1 )
			: allPriorityLevels;

	return priorityLevels.length > 0
		? createElement( vdom.type, {
				...vdom.props,
				priorityLevels,
			} )
		: vdom.props.element;
};

/**
 * IDs of router regions with an `attachTo` property pointing to the same parent
 * element.
 */
const regionsToAttachByParent = new WeakMap< Element, string[] >();

/**
 * Map of root fragments by parent element, used to render router regions with
 * the `attachTo` property. Those elements with the same parent are rendered
 * together in the corresponding root fragment.
 */
const rootFragmentsByParent = new WeakMap< Element, any >();

/**
 * Set of router regions using the `attachTo` property that are present in the
 * initial page.
 *
 * These regions should be treated as regular regions without the `attachTo`
 * attribute as they don't need to be appended; they are already in the HTML.
 */
const initialRegionsToAttach = new Set< string >();

/**
 * Fetches and prepares a page from a given URL.
 *
 * @param url          The URL of the page to fetch.
 * @param options      Options for the fetch operation.
 * @param options.html Optional HTML content. If provided, the function will use
 *                     this instead of fetching from the URL.
 * @return             A Promise that resolves to the prepared page, or false if
 *                     there was an error during fetching or preparation.
 */
const fetchPage = async ( url: string, { html }: { html: string } ) => {
	try {
		if ( ! html ) {
			const res = await window.fetch( url );
			if ( res.status !== 200 ) {
				return false;
			}
			html = await res.text();
		}
		const dom = new window.DOMParser().parseFromString( html, 'text/html' );
		return await preparePage( url, dom );
	} catch {
		return false;
	}
};

/**
 * Processes a DOM document to extract router regions and related resources.
 *
 * This function analyzes the provided DOM document and creates a virtual DOM
 * representation of all HTML regions marked with a `router-region` directive.
 * It also extracts and preloads associated styles and scripts to prepare for
 * rendering the page.
 *
 * @param url             The URL associated with the page, used for asset
 *                        loading and caching.
 * @param dom             The DOM document to process.
 * @param vdomParams      Optional parameters for virtual DOM processing.
 * @param vdomParams.vdom An optional existing virtual DOM cache to check for
 *                        regions. If a region exists in this cache, it will be
 *                        reused instead of creating a new vDOM representation.
 * @return                A Promise that resolves to a {@link Page} object
 *                        containing the virtual DOM for all router regions,
 *                        preloaded styles and scripts, page title, and initial
 *                        server-rendered data.
 */
const preparePage: PreparePage = async ( url, dom, { vdom } = {} ) => {
	// Remove all noscript elements as they're irrelevant when request is served via router.
	// This prevents browsers from extracting styles from noscript tags.
	dom.querySelectorAll( 'noscript' ).forEach( ( el ) => el.remove() );

	const regions = {};
	const regionsToAttach = {};
	dom.querySelectorAll( regionsSelector ).forEach( ( region ) => {
		const { id, attachTo } = parseRegionAttribute( region );

		if ( region.parentElement.closest( `[${ regionAttr }]` ) ) {
			regions[ id ] = undefined;
		} else {
			regions[ id ] = vdom?.has( region )
				? vdom.get( region )
				: toVdom( region );
		}

		if ( attachTo && ! initialRegionsToAttach.has( id ) ) {
			regionsToAttach[ id ] = attachTo;
		}
	} );

	const title = dom.querySelector( 'title' )?.innerText;
	const initialData = parseServerData( dom );

	// Wait for styles and modules to be ready.
	const [ styles, scriptModules ] = await Promise.all( [
		Promise.all( preloadStyles( dom ) ),
		Promise.all( preloadScriptModules( dom ) ),
	] );

	return {
		regions,
		regionsToAttach,
		styles,
		scriptModules,
		title,
		initialData,
		url,
	};
};

/**
 * Renders a page by applying styles, populating server data, rendering regions,
 * and updating the document title.
 *
 * @param page The {@link Page} object to render.
 */
const renderPage = ( page: Page ) => {
	applyStyles( page.styles );

	// Clone regionsToAttach.
	const regionsToAttach = { ...page.regionsToAttach };

	batch( () => {
		// Updates the server data.
		populateServerData( page.initialData );

		// Triggers navigation invalidations (`getServerState` and
		// `getServerContext`).
		navigationSignal.value += 1;

		// Resets all router regions before setting the actual values.
		( routerRegions as Map< string, any > ).forEach( ( signal ) => {
			signal.value = null;
		} );

		// Inits regions with attachTo that don't exist yet.
		const parentsToUpdate = new Set< Element >();
		for ( const id in regionsToAttach ) {
			const parent = document.querySelector( regionsToAttach[ id ] );
			if ( ! regionsToAttachByParent.has( parent ) ) {
				regionsToAttachByParent.set( parent, [] );
			}
			const regions = regionsToAttachByParent.get( parent );
			if ( ! regions.includes( id ) ) {
				regions.push( id );
				parentsToUpdate.add( parent );
			}
		}

		// Updates all existing regions.
		for ( const id in page.regions ) {
			if ( routerRegions.has( id ) ) {
				routerRegions.get( id ).value = cloneRouterRegionContent(
					page.regions[ id ]
				);
			}
		}

		// Renders regions attached to the same parent in the same fragment.
		parentsToUpdate.forEach( ( parent ) => {
			const ids = regionsToAttachByParent.get( parent );
			const vdoms = ids.map( ( id ) => page.regions[ id ] );

			if ( ! rootFragmentsByParent.has( parent ) ) {
				const regions = vdoms.map( ( { props, type } ) => {
					const elementType =
						typeof type === 'function' ? props.type : type;

					// Creates an element with the obtained type where the
					// region will be rendered. The type should match the one of
					// the root vnode.
					const region = document.createElement( elementType );
					parent.appendChild( region );
					return region;
				} );
				rootFragmentsByParent.set(
					parent,
					getRegionRootFragment( regions )
				);
			}
			const fragment = rootFragmentsByParent.get( parent );
			render( vdoms, fragment );
		} );
	} );

	if ( page.title ) {
		document.title = page.title;
	}
};

/**
 * Loads the given page forcing a full page reload.
 *
 * The function returns a promise that won't resolve, useful to prevent any
 * potential feedback indicating that the navigation has finished while the new
 * page is being loaded.
 *
 * @param href The page href.
 * @return Promise that never resolves.
 */
const forcePageReload = ( href: string ) => {
	window.location.assign( href );
	return new Promise( () => {} );
};

// Safety timer (in ms) that resets a stuck `state.navigating`. It is armed in
// two places: at the start of the popstate handler and right before
// `navigate()` falls back to a full page reload. Both paths can leave a
// navigation that never reaches its own end write (a promise that never
// settles, or a reload whose new document never arrives), so this timer sets
// `navigating` back to `false` after the bound. The callback only writes if
// the navigation still holds the current token and `navigating` is still
// `true`, so a navigation that ended normally or was superseded makes it a
// no-op. It leaves `initiator` untouched, like every other end write.
// Browsers may delay the callback in background tabs; the guard makes that
// harmless.
//
// The value matches `navigate()`'s default `timeout` by choice, but the two
// are independent.
const LIFECYCLE_RELEASE_BOUND = 10000;

// Listen to the back and forward buttons and restore the page if it's in the
// cache.
//
// Every write that ends a navigation lifecycle in this file (in `navigate()`'s
// `finally`, in this handler, and in the release timers) is guarded by
// `currentNavigationId === token`. Any new lifecycle write needs the same
// guard, or a stale navigation could end a newer one. This handler runs
// outside any directive scope, so its writes do not need `writeFrameScope`.
window.addEventListener( 'popstate', async () => {
	const pagePath = getPagePath( window.location.href ); // Remove hash.

	// Claim the lifecycle token (see the `navigationId` comment above
	// `navigate()`). From here on this handler is responsible for ending the
	// lifecycle on every exit path.
	const token = ++navigationId;
	currentNavigationId = token;

	// Arm the release timer before deciding whether to reload, so that a
	// reload whose new document never arrives, or an `await` that never
	// settles, still ends the lifecycle. The timer is never cleared: its guard
	// already makes it a no-op once the lifecycle has ended.
	setTimeout( () => {
		if ( currentNavigationId === token && state.navigating ) {
			state.navigating = false;
		}
	}, LIFECYCLE_RELEASE_BOUND );

	// Reload first when the page is not cached, before any state write. This
	// way no consumer effect can run (and throw) before the reload starts.
	if ( ! pages.has( pagePath ) ) {
		try {
			window.location.reload();
		} finally {
			// If a navigation was in flight, this traversal superseded it. End
			// its lifecycle and clear the retained `initiator`, writing only
			// the keys that actually change so no watcher is notified for
			// nothing.
			if (
				currentNavigationId === token &&
				( state.navigating ||
					( state.initiator !== null &&
						state.initiator !== undefined ) )
			) {
				batch( () => {
					if ( state.navigating ) {
						state.navigating = false;
					}
					if ( state.initiator !== null ) {
						state.initiator = null;
					}
				} );
			}
		}
		return;
	}

	try {
		// If a navigation is in flight, this traversal supersedes it. Clear
		// its `initiator` now so the identity does not linger while this
		// traversal takes over. An idle traversal writes nothing.
		if ( state.navigating ) {
			state.initiator = null;
		}

		const page = await pages.get( pagePath );

		// A cached entry that resolved to nothing also reloads. Same as above:
		// reload first, then end the lifecycle, writing only what changes.
		if ( ! page ) {
			try {
				window.location.reload();
			} finally {
				if (
					currentNavigationId === token &&
					( state.navigating ||
						( state.initiator !== null &&
							state.initiator !== undefined ) )
				) {
					batch( () => {
						if ( state.navigating ) {
							state.navigating = false;
						}
						if ( state.initiator !== null ) {
							state.initiator = null;
						}
					} );
				}
			}
			return;
		}

		// Start of the lifecycle. If a `navigate()` call is still in flight,
		// `navigating` is already `true` and the signal dedups the write.
		if ( currentNavigationId === token ) {
			batch( () => {
				state.navigating = true;
				state.initiator = null;
			} );
		}

		batch( () => {
			state.url = window.location.href;
			renderPage( page );
		} );

		// Schedule the end write on the next frame, like `navigate()` does, so
		// directives observe the transition (see the comment on that write).
		// The guard is re-checked inside the callback because a newer
		// navigation may have claimed the token in the meantime.
		if ( currentNavigationId === token ) {
			afterNextFrame( () => {
				if ( currentNavigationId === token ) {
					state.navigating = false;
				}
			} );
		}
	} catch ( error ) {
		// The reload paths above handle their own end writes, so a `finally`
		// here would wrongly end a lifecycle on those exits. Errors are handled
		// here instead: schedule the guarded end write and rethrow at once,
		// with nothing asynchronous in between.
		if ( currentNavigationId === token && state.navigating ) {
			afterNextFrame( () => {
				if ( currentNavigationId === token ) {
					state.navigating = false;
				}
			} );
		}
		throw error;
	}
} );

// Detect router regions with `attachTo` in the initial page. This step should
// be done before the initial page is processed with `preparePage()` so this
// function treats them as regular router regions.
document.querySelectorAll( regionsSelector ).forEach( ( region ) => {
	const { id, attachTo } = parseRegionAttribute( region );
	if ( attachTo ) {
		initialRegionsToAttach.add( id );
	}
} );

// Initialize the router and cache the initial page using the initial vDOM.
window.document
	.querySelectorAll< HTMLScriptElement >( 'script[type=module][src]' )
	.forEach( ( { src } ) => markScriptModuleAsResolved( src ) );

// Await hydration completion before setting the initial page to ensure initialVdom is populated.
( async () => {
	const initialVdomMap = await initialVdomPromise;
	pages.set(
		getPagePath( window.location.href ),
		Promise.resolve(
			preparePage( getPagePath( window.location.href ), document, {
				vdom: initialVdomMap,
			} )
		)
	);
} )();

// Variable to store the current navigation.
let navigatingTo = '';

// Token that identifies the navigation currently in flight. A navigation
// claims it with `currentNavigationId = ++navigationId` and then guards all
// its lifecycle writes (`state.navigating` and `state.initiator`) with
// `currentNavigationId === token`, so a superseded navigation never writes
// over a newer one. Whoever claims the token must end the lifecycle on every
// exit path.
let navigationId = 0;
let currentNavigationId = 0;

// Marker for the directive scope that is active while `navigate()` performs
// its own lifecycle writes. `resolveInitiator()` refuses to derive an
// initiator from a scope equal to this marker. Without it, a scope-less
// `watch()` or `effect()` reacting to one of those writes and calling
// `navigate()` would inherit the previous navigation's region id. A
// `withScope`-wrapped callback carries its own scope, so its attribution is
// unaffected.
//
// It is set in exactly two places, the start batch and the commit batch in
// `navigate()`, always with save-and-restore rather than set-and-clear.
// Navigations can nest (a reactive navigation started from inside another
// navigation's write), and a plain clear would remove the outer marker too,
// letting a deferred effect inherit the outer region.
//
// The frame-scheduled end write and the release timers run in detached
// callbacks with an empty scope stack, so they need no marker: a scope-less
// consumer navigating from them derives `null`, while a `data-wp-watch`
// consumer (which runs in its own scope) derives its own region. That second
// case is what the documented region-scoped focus pattern relies on.
let writeFrameScope: ReturnType< typeof getScope >;

let hasLoadedNavigationTextsData = false;
const navigationTexts = {
	loading: 'Loading page, please wait.',
	loaded: 'Page Loaded.',
};

interface Store {
	state: {
		url: string;
		navigation: {
			hasStarted: boolean;
			hasFinished: boolean;
		};
		// Both keys stay `undefined` until the first navigation. See the
		// comment on the store literal below.
		navigating?: boolean;
		initiator?: string | null;
	};
	actions: {
		navigate: (
			href: string,
			options?: NavigateOptions
		) => Promise< void >;
		prefetch: ( url: string, options?: PrefetchOptions ) => Promise< void >;
	};
}

/**
 * Resolves the `initiator` option of `actions.navigate()` into the value
 * published on `state.initiator`.
 *
 * A string is returned as is and `null` returns `null`. When the option is
 * omitted, the initiator is derived from the directive scope the action was
 * called from: the id of the closest router region (including the element
 * itself), or `null` when there is none. Any other value warns and resolves
 * to `null`.
 *
 * Derivation never throws. It returns `null` for a call made outside any
 * scope, for a scope whose `ref.current` is not an element, and for an
 * element with no enclosing region. There is no `isConnected` check on
 * purpose: a detached element still inside a region reports that region.
 *
 * It must run synchronously at the start of `navigate()`, before any
 * `yield`, because the store proxy only keeps the caller's scope active for
 * the synchronous part of the call. Timer callbacks and awaited
 * continuations run without it.
 *
 * @param declared The raw `options.initiator` value passed to `navigate()`.
 * @return The value to publish on `state.initiator`.
 */
const resolveInitiator = ( declared: unknown ): string | null => {
	if ( typeof declared === 'string' ) {
		return declared;
	}
	if ( declared === null ) {
		return null;
	}
	if ( declared === undefined ) {
		// Refuse the scope when it is the marker `navigate()` installs around
		// its own writes (see `writeFrameScope`). The `scope &&` check is not
		// strictly needed today, since a scope-less call returns `null` below
		// anyway, but it keeps the intent explicit: only an inherited scope
		// is refused.
		const scope = getScope();
		if ( scope && scope === writeFrameScope ) {
			return null;
		}
		const element = scope?.ref?.current;
		if ( typeof element?.closest !== 'function' ) {
			return null;
		}
		const region = element.closest( `[${ regionAttr }]` );
		if ( ! region ) {
			return null;
		}
		return parseRegionId( region.getAttribute( regionAttr ) );
	}
	if ( globalThis.SCRIPT_DEBUG ) {
		warn(
			'The `initiator` option of `actions.navigate()` must be a string or null. Ignoring the value.'
		);
	}
	return null;
};

const { state: privateState } = store(
	'core/router/private',
	{
		state: {
			navigation: {
				hasStarted: false,
				hasFinished: false,
			},
		},
	},
	{ lock: true }
);

export const { state, actions } = store< Store >( 'core/router', {
	state: {
		// `navigating` and `initiator` are deliberately not declared here.
		// Giving them an idle value would change a tracked signal from
		// `undefined` to a value when the router module lazily loads, which
		// would re-run every watcher already bound to them.
		get navigation() {
			if ( globalThis.SCRIPT_DEBUG ) {
				warn(
					`The usage of state.navigation.{hasStarted|hasFinished} from core/router is deprecated and will stop working in WordPress 7.1.`
				);
			}
			return privateState.navigation;
		},
	},
	actions: {
		/**
		 * Navigates to the specified page.
		 *
		 * This function normalizes the passed href, fetches the page HTML if
		 * needed, and updates any interactive regions whose contents have
		 * changed. It also creates a new entry in the browser session history.
		 *
		 * @param href                               The page href.
		 * @param [options]                          Options object.
		 * @param [options.force]                    If true, it forces re-fetching the URL.
		 * @param [options.html]                     HTML string to be used instead of fetching the requested URL.
		 * @param [options.replace]                  If true, it replaces the current entry in the browser session history.
		 * @param [options.timeout]                  Time until the navigation is aborted, in milliseconds. Default is 10000.
		 * @param [options.loadingAnimation]         Whether an animation should be shown while navigating. Default to `true`.
		 * @param [options.screenReaderAnnouncement] Whether a message for screen readers should be announced while navigating. Default to `true`.
		 * @param [options.initiator]                Who started the navigation. A string is used as is, `null` publishes `null`, and omitting it derives the value from the directive scope. Any other value warns and resolves to `null`.
		 *
		 * @return  Promise that resolves once the navigation is completed or aborted.
		 */
		*navigate( href: string, options: NavigateOptions = {} ) {
			const { clientNavigationDisabled } = getConfig();
			if ( clientNavigationDisabled ) {
				yield forcePageReload( href );
			}

			// Read the scope now, before any `yield`, while the caller's scope
			// is still active. It marks the two write sites below so the
			// frame-scope guard sees the initiating element's scope.
			const entryScope = getScope();
			const initiator = resolveInitiator( options.initiator );

			const pagePath = getPagePath( href );
			const { navigation } = privateState;
			const {
				loadingAnimation = true,
				screenReaderAnnouncement = true,
				timeout = 10000,
			} = options;

			navigatingTo = href;
			actions.prefetch( pagePath, options );

			// Creates a promise that resolves when the specified timeout ends.
			// The timeout value is 10 seconds by default.
			const timeoutPromise = new Promise< void >( ( resolve ) =>
				setTimeout( resolve, timeout )
			);

			// Doesn't update the navigation status immediately, wait 400 ms.
			const loadingTimeout = setTimeout( () => {
				if ( navigatingTo !== href ) {
					return;
				}

				if ( loadingAnimation ) {
					navigation.hasStarted = true;
					navigation.hasFinished = false;
				}
				if ( screenReaderAnnouncement ) {
					a11ySpeak( 'loading' );
				}
			}, 400 );

			// Claim the lifecycle token. This navigation must end the lifecycle
			// on every exit path; see the `finally` below.
			const token = ++navigationId;
			currentNavigationId = token;

			try {
				// Write both keys in one batch so no watcher sees `navigating`
				// as `true` before `initiator` is set. No token guard is needed:
				// this runs synchronously, before any other navigation can
				// claim the token. The write is marked with the initiating
				// scope for the frame-scope guard (see `writeFrameScope`).
				const prevWriteFrameScopeAtStart = writeFrameScope;
				writeFrameScope = entryScope;
				try {
					batch( () => {
						state.navigating = true;
						state.initiator = initiator;
					} );
				} finally {
					writeFrameScope = prevWriteFrameScopeAtStart;
				}

				const page = yield Promise.race( [
					pages.get( pagePath ),
					timeoutPromise,
				] );

				// Dismisses loading message if it hasn't been added yet.
				clearTimeout( loadingTimeout );

				// Once the page is fetched, the destination URL could have changed
				// (e.g., by clicking another link in the meantime). If so, bail
				// out, and let the newer execution to update the HTML.
				if ( navigatingTo !== href ) {
					return;
				}

				if (
					page &&
					! page.initialData?.config?.[ 'core/router' ]
						?.clientNavigationDisabled
				) {
					yield importScriptModules( page.scriptModules );

					// Mark this write with the initiating scope as well (see
					// `writeFrameScope`). The batch keeps `state.url` and
					// `renderPage()` together so consumers see the URL and the
					// DOM change at once.
					const prevWriteFrameScopeAtCommit = writeFrameScope;
					writeFrameScope = entryScope;
					try {
						batch( () => {
							// Updates the URL in the state.
							state.url = href;

							// Updates the navigation status once the new page rendering
							// has been completed.
							if ( loadingAnimation ) {
								navigation.hasStarted = false;
								navigation.hasFinished = true;
							}

							// Renders the new page.
							renderPage( page );
						} );
					} finally {
						writeFrameScope = prevWriteFrameScopeAtCommit;
					}

					window.history[
						options.replace ? 'replaceState' : 'pushState'
					]( { wpInteractivityId: sessionId }, '', href );

					if ( screenReaderAnnouncement ) {
						a11ySpeak( 'loaded' );
					}

					// Scroll to the anchor if exits in the link.
					const { hash } = new URL( href, window.location.href );
					if ( hash ) {
						document.querySelector( hash )?.scrollIntoView();
					}
				} else {
					// `forcePageReload()` never resolves, so the `finally` below
					// never runs if the new document does not arrive. Arm the
					// release timer so `navigating` is still reset. It leaves
					// `initiator` untouched.
					setTimeout( () => {
						if (
							currentNavigationId === token &&
							state.navigating
						) {
							state.navigating = false;
						}
					}, LIFECYCLE_RELEASE_BOUND );
					yield forcePageReload( href );
				}
			} finally {
				// The end write. It runs on the next frame, like every other end
				// write, so the directive runtime's frame scheduler observes the
				// transition; a microtask or a plain `setTimeout` would hide it
				// from directive consumers. The guard is re-checked inside the
				// callback because a second click or a Back press can claim the
				// token before the frame runs.
				//
				// No `writeFrameScope` marker here: the callback runs with an
				// empty scope stack, so a marker would change nothing, and a
				// forgotten restore would pin the marker to this navigation's
				// scope and null the next navigation from the same element.
				if ( currentNavigationId === token ) {
					afterNextFrame( () => {
						if ( currentNavigationId === token ) {
							state.navigating = false;
						}
					} );
				}
			}
		},

		/**
		 * Prefetches the page with the passed URL.
		 *
		 * The function normalizes the URL and stores internally the fetch
		 * promise, to avoid triggering a second fetch for an ongoing request.
		 *
		 * @param url             The page URL.
		 * @param [options]       Options object.
		 * @param [options.force] Force fetching the URL again.
		 * @param [options.html]  HTML string to be used instead of fetching the requested URL.
		 *
		 * @return  Promise that resolves once the page has been fetched.
		 */
		*prefetch( url: string, options: PrefetchOptions = {} ) {
			const { clientNavigationDisabled } = getConfig();
			if ( clientNavigationDisabled ) {
				return;
			}

			const pagePath = getPagePath( url );
			if ( options.force || ! pages.has( pagePath ) ) {
				pages.set(
					pagePath,
					fetchPage( pagePath, { html: options.html } )
				);
			}

			yield pages.get( pagePath );
		},
	},
} );

// Initialize the URL in the state if it hasn't been set yet in the server.
state.url = state.url || window.location.href;

/**
 * Announces a message to screen readers.
 *
 * This is a wrapper around the `@wordpress/a11y` package's `speak` function. It handles importing
 * the package on demand and should be used instead of calling `a11y.speak` directly.
 *
 * @param messageKey The message to be announced by assistive technologies.
 */
function a11ySpeak( messageKey: keyof typeof navigationTexts ) {
	if ( ! hasLoadedNavigationTextsData ) {
		hasLoadedNavigationTextsData = true;
		const content = document.getElementById(
			'wp-script-module-data-@wordpress/interactivity-router'
		)?.textContent;
		if ( content ) {
			try {
				const parsed = JSON.parse( content );
				if ( typeof parsed?.i18n?.loading === 'string' ) {
					navigationTexts.loading = parsed.i18n.loading;
				}
				if ( typeof parsed?.i18n?.loaded === 'string' ) {
					navigationTexts.loaded = parsed.i18n.loaded;
				}
			} catch {}
		} else {
			// Fallback to localized strings from Interactivity API state.
			// @todo This block is for Core < 6.7.0. Remove when support is dropped.

			// @ts-expect-error `texts` is not part of the typed navigation state.
			if ( state.navigation.texts?.loading ) {
				// @ts-expect-error `texts` is not part of the typed navigation state.
				navigationTexts.loading = state.navigation.texts.loading;
			}
			// @ts-expect-error `texts` is not part of the typed navigation state.
			if ( state.navigation.texts?.loaded ) {
				// @ts-expect-error `texts` is not part of the typed navigation state.
				navigationTexts.loaded = state.navigation.texts.loaded;
			}
		}
	}

	const message = navigationTexts[ messageKey ];

	import( '@wordpress/a11y' ).then(
		( { speak } ) => speak( message ),
		// Ignore failures to load the a11y module.
		() => {}
	);
}
