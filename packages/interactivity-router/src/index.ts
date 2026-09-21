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
	 * Identifies who initiated this navigation, published on `state.initiator`
	 * for the duration of the navigation lifecycle. Three arms: a `string`
	 * (e.g. a router region's id) is used verbatim; `null` explicitly
	 * suppresses attribution, so `state.initiator` reads `null` throughout;
	 * `undefined` (the default) derives the initiator from the ambient
	 * directive scope the call was made from.
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
 * Parses the given region's directive with the shared directive-value
 * interpretation used by the runtime.
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
 * Parses a region attribute into the initiator id used by the router.
 *
 * The shared directive-value interpretation supplies either a string or an
 * object. Region attribution keeps a nonempty string id and treats every
 * other value as absent.
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

// Bound (in ms) for the popstate handler's lifecycle release below --
// discharges a claim whose terminating structures (the `try`/`catch`) never
// see its exit: a `pages.get()` await that never settles, or a `reload()`
// whose document replacement the visitor declines. Same horizon as
// `navigate()`'s own page race (`timeout = 10000` above); the two are
// independent and changing one must not change the other.
//
// INVARIANT, invisible from the call graph: this bound must remain greater
// than one frame. The release and the scheduled end write below are both
// guarded and so compose safely at any bound, but a release firing *before*
// the pending directive flush would pre-empt it and reintroduce the exact
// coalescing defect the frame scheduler exists to fix (see the
// `afterNextFrame` comment on `navigate()`'s end write above). At 10 s
// versus a ~16 ms frame this is unreachable by three orders of magnitude --
// a contributor tuning this constant down would not see it coming. This
// comment is a signpost, not the protection: the protection is
// `test/release-bound-observability.ts`, which goes red on a tuned-down
// bound.
const POPSTATE_RELEASE_BOUND = 10000;

// Listen to the back and forward buttons and restore the page if it's in the
// cache.
//
// Four end-write sites exist in this file: `navigate()`'s `finally` above,
// this handler's cached-branch scheduled end, this handler's `catch`, and
// the lifecycle release armed below. Every one of them is guarded by
// `currentNavigationId === token`; a future lifecycle write added without
// that guard would reintroduce spurious end transitions. The popstate frame
// carries no directive scope, so -- unlike `navigate()`'s start and commit
// batches -- none of these writes needs a `writeFrameScope` marker.
window.addEventListener( 'popstate', async () => {
	const pagePath = getPagePath( window.location.href ); // Remove hash.

	// Claim the lifecycle token -- see the `navigationId`/
	// `currentNavigationId` comment above `navigate()`. Whoever claims it
	// owes the lifecycle a terminal write on every exit path that resumes.
	const token = ++navigationId;
	currentNavigationId = token;

	// Arm the release *before* the uncached decision below, so a claim that
	// never resumes -- a parked `await`, or a `reload()` whose document
	// replacement never lands -- still discharges its debt. Guarded, and
	// re-checked at fire time: no suspension sits between this timer's
	// guard and its write, so it is the one end-write site legitimately
	// exempt from the "re-check after every suspension" rule the other
	// three follow, and the one write site outside a terminal-write
	// structure (the `try`/`catch` below). Never cleared on a designed
	// exit -- the guard already no-ops there.
	setTimeout( () => {
		if ( currentNavigationId === token && state.navigating ) {
			state.navigating = false;
		}
	}, POPSTATE_RELEASE_BOUND );

	// The uncached decision, before any effect-running write. This splits
	// today's short-circuited `pages.has( … ) && ( await pages.get( … ) )`
	// expression: a page absent from the cache reloads with no consumer
	// code having run beforehand, so a throwing watcher can never suppress
	// the reload -- structurally restoring that property of today's code.
	if ( ! pages.has( pagePath ) ) {
		window.location.reload();
		return;
	}

	try {
		// The conditional supersession-moment clear. Conditional, so a
		// plain idle traversal writes nothing and no identity watcher is
		// spuriously notified: if a navigation was in flight, this
		// traversal supersedes it and that navigation's identity must not
		// linger on a lifecycle this traversal is about to claim.
		if ( state.navigating ) {
			state.initiator = null;
		}

		const page = await pages.get( pagePath );

		// A cached entry that resolves falsy reloads on a normal return,
		// writing nothing beyond the clear above.
		if ( ! page ) {
			window.location.reload();
			return;
		}

		// The token-guarded start pair. On a supersession path (this
		// traversal landing while a `navigate()` call still holds an
		// older claim) this write is entirely absorbed by same-value
		// dedup on `navigating` -- the mechanism working as intended, not
		// a gap.
		if ( currentNavigationId === token ) {
			batch( () => {
				state.navigating = true;
				state.initiator = null;
			} );
		}

		// The existing render batch, untouched -- see Task 5 row 10.
		batch( () => {
			state.url = window.location.href;
			renderPage( page );
		} );

		// The scheduled, re-checked guarded end. Must stay on
		// `afterNextFrame`, exactly like `navigate()`'s own end write:
		// publishing it any earlier would drop or un-paint the transition
		// for directive consumers -- see the comment on that end write.
		if ( currentNavigationId === token ) {
			afterNextFrame( () => {
				if ( currentNavigationId === token ) {
					state.navigating = false;
				}
			} );
		}
	} catch ( error ) {
		// A `finally` is the wrong tool here, and the asymmetry with
		// `navigate()` is deliberate, not an inconsistency: `navigate()`'s
		// designed *non-writing* exit is a suspension (a parked generator
		// never runs its `finally`), while this handler's designed
		// non-writing exits are normal returns (the two reloads above),
		// which a `finally` cannot tell apart from a writing path without
		// destroying those reload-path readings. Only exceptional-vs-
		// designed carves this handler correctly, so exceptional exits
		// discharge through this `catch` instead, which schedules the
		// guarded idle restoration and rethrows immediately, with nothing
		// suspending between the two, so the rethrow's timing is
		// unchanged from today's.
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

// Monotonic token used to account for supersession of the lifecycle write
// protocol (the `state.navigating`/`state.initiator` pair). A navigation
// claims the token by setting `currentNavigationId = ++navigationId`; every
// lifecycle write it performs thereafter is guarded by
// `currentNavigationId === <its own token>`. Whoever claims the token owes
// the lifecycle a terminal write on every exit path that resumes.
let navigationId = 0;
let currentNavigationId = 0;

// Frame-scope guard: identity marker for the ambient directive scope active
// during one of the router's own lifecycle writes. `resolveInitiator()`'s
// derive branch refuses to attribute a navigation to a scope that *is* this
// marker, which stops a scope-less `watch()`/`effect()` reacting to one of
// `navigate()`'s own writes from inheriting the previous navigation's
// region id, without breaking attribution for a `withScope`-wrapped
// callback that carries a scope of its own.
//
// Marked at exactly **two** sites — the start `batch()` and the existing
// commit batch below — with save-and-restore
// (`const prev = writeFrameScope; writeFrameScope = entryScope; try {
// …write…; } finally { writeFrameScope = prev; }`), never set-and-clear.
// Write spans nest (a reactive navigation started from inside another
// navigation's write span), and a set-and-clear form leaks: the inner
// span's clear re-opens inheritance for an effect deferred to the outer
// flush, so a third-level navigation started from that effect would
// wrongly inherit the outer navigation's region. Save-and-restore keeps
// the outer span's scope installed once the inner span closes, and for a
// top-level navigation the restored value is `undefined`, so off-frame
// behaviour is unchanged.
//
// No marker anywhere else, and the two consumer kinds resolve differently
// there — which is the point. The scheduled end write and the popstate
// lifecycle release both execute in detached macrotasks whose scope stack
// is empty and whose marker has already been restored, so a **scope-less**
// consumer navigating from either derives `null` by scope absence, while a
// **`data-wp-watch`** consumer — which does run in scope — derives *its
// own* region, because the restored marker refuses nothing. That second
// reading is what the AC25(b) region-scoped focus pattern is built on. The
// popstate handler's frame carries no scope at all. A future `navigate()`-
// side scope-carrying write added without this marker would re-open
// initiator inheritance for it.
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
		// `navigating` and `initiator` are intentionally optional-honest:
		// they read `undefined` until the first navigation claims the
		// lifecycle. See the "do not declare" comment on the store literal
		// below for why neither key is given an idle value here either.
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
 * The three declared arms are honoured verbatim, and declaration always
 * wins ahead of derivation: a `string` is returned as given, and `null`
 * explicitly suppresses attribution. `undefined` (the option omitted)
 * derives the initiator from the ambient directive scope the call was made
 * from — the nearest router region (self-inclusive) enclosing the element
 * whose directive invoked the action, or `null` if there is none. Anything
 * else is not a valid arm; it warns and falls back to `null`, and it never
 * falls through to derivation.
 *
 * No branch throws: derivation degrades to `null` for a scope-less call
 * (e.g. a vendor `import()` + `navigate()`), for a scope whose `ref.current`
 * is not an element, and for an element with no enclosing router region.
 * There is no "derivation error" observable — absence of identity is a
 * documented normal value (Requirement 11). Deliberately no `isConnected`
 * check either: the rule is uniform over any tree, so a detached element
 * that still sits inside a region carrier reports that region's honest id.
 *
 * This must be called here, at a generator step in `navigate()`'s
 * synchronous prefix — the only place the caller's scope is reliably
 * ambient. The store proxy binds the ambient scope around every synchronous
 * span of a call, but resets it before awaited continuations and inside
 * timer callbacks, so this resolution must never move into either.
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
		// Frame-scope guard, ahead of the ref/region walk: refuse a scope
		// that reached here only because it is the marker
		// `navigate()` installed around one of its own write frames — see
		// the `writeFrameScope` comment above. The `scope &&` conjunct
		// states intent ("we are refusing an *inherited* scope") rather
		// than a guarantee: today `getScope()` and `writeFrameScope` are
		// each either an object or `undefined`, so a genuinely scope-less
		// call (`scope` and the marker both `undefined`) already falls
		// through this clause and returns `null` two lines below, via the
		// `element` check — the short-circuit changes nothing observable
		// for that case now, and is kept for a future derivation clause
		// that might return non-null off-scope.
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
		// `navigating` and `initiator` are deliberately *not* declared here,
		// and neither is assigned at module scope. Declaring either with an
		// idle value would change a tracked signal from `undefined` to a
		// value the moment the router module lazily loads, which re-runs
		// every watcher already bound to it and breaks the
		// exactly-one-hydration-run guarantee.
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
		 * @param [options.initiator]                A string is published verbatim; `null` suppresses attribution so `state.initiator` reads `null` throughout; omitted derives from the ambient directive scope; any other value warns and resolves to `null`.
		 *
		 * @return  Promise that resolves once the navigation is completed or aborted.
		 */
		*navigate( href: string, options: NavigateOptions = {} ) {
			const { clientNavigationDisabled } = getConfig();
			if ( clientNavigationDisabled ) {
				yield forcePageReload( href );
			}

			// Captured once, at this generator step's synchronous prefix —
			// the same place `resolveInitiator()` reads the ambient scope
			// (see its own comment) — so the frame-scope guard marks its
			// two write sites below with the *initiating* element's scope,
			// not whatever happens to be ambient when each write runs.
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

			// Claim the lifecycle token. Whoever claims it owes the lifecycle
			// a terminal write on every exit path that resumes — see the
			// `finally` below.
			const token = ++navigationId;
			currentNavigationId = token;

			try {
				// The start pair is a single, undebounced, atomic write:
				// batching the two keys means watchers observe both change
				// in one notification, so no consumer ever sees `navigating`
				// truthy with `initiator` still absent. It needs no token
				// guard because it runs synchronously in the claim's own
				// frame, before any other navigation can supersede it.
				// Frame-scope guard, save-and-restore: mark this write's
				// span with the initiating scope, then restore whatever was
				// there before (see the `writeFrameScope` comment above).
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

					// Frame-scope guard, save-and-restore — see the
					// `writeFrameScope` comment above. The batch below is
					// otherwise untouched: its statements' order is what
					// keeps `state.url` atomic with `renderPage()`, so a
					// rendering consumer sees the URL and the DOM change
					// together.
					const prevWriteFrameScopeAtCommit = writeFrameScope;
					writeFrameScope = entryScope;
					try {
						batch( () => {
							// Updates the URL in the state.
							state.url = href;

							// Updates the navigation status once the the new page rendering
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
					yield forcePageReload( href );
				}
			} finally {
				// The single end-write site. Every lifecycle end write
				// re-evaluates its guard inside its scheduled callback,
				// after its suspension point: the frame-wide window between
				// scheduling and running is reachable by any user-initiated
				// navigation — a second click, a Back press — not merely by
				// consumer code, so a stale scheduled end must find out it
				// no longer owns the token before it writes. The end write
				// itself must stay on `afterNextFrame` rather than a
				// microtask or a bare `setTimeout`: moving it off the
				// directive runtime's shared frame scheduler would silently
				// un-observe transitions for every directive consumer.
				//
				// Deliberately no `writeFrameScope` marker here. This write
				// runs in a detached macrotask whose scope stack is already
				// empty, so marking it correctly — with the same
				// save-and-restore shape used above — is behaviourally
				// inert: every consumer of this write reads exactly what it
				// reads without a marker, because the guard compares scope
				// identity and no consumer runs inside this callback's span
				// in the first place. What is not inert is marking it and
				// forgetting to restore, which is the shape a fire-and-
				// forget `afterNextFrame` callback invites: it would pin
				// `writeFrameScope` to this navigation's entry scope
				// permanently, silently nulling the *next* navigation from
				// the same element.
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
