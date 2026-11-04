/** Navigation resolves attachment targets against the live, interactive DOM. */
import {
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	test,
	vi,
} from 'vitest';
import {
	useEffect as usePreactEffect,
	useLayoutEffect as usePreactLayoutEffect,
} from 'preact/hooks';
import {
	asDangerousHTML,
	getContext,
	getElement,
	getServerContext,
	privateApis,
	store,
	useLayoutEffect as useRuntimeLayoutEffect,
	withScope,
} from '@wordpress/interactivity';
import { actions, state } from '../index';
import {
	hydrateHtml,
	hydrateTrigger,
	nextFrames,
	pageHtml,
	quiet,
} from './fixtures/helpers';

// Supply only the browser APIs that jsdom cannot run.
await vi.hoisted( async () => {
	await import( './fixtures/jsdom-setup' );
	// jsdom has no innerText; titles contain only text, with no layout to model.
	Object.defineProperty( HTMLTitleElement.prototype, 'innerText', {
		/** Returns the title text that browsers expose through innerText. */
		get() {
			return this.textContent;
		},
		// Allow the isolated test environment to release the shim.
		configurable: true,
	} );
} );

// History entries belong to the runtime session, as on an initially loaded page.
const { getScope: getCurrentScope, sessionId } = privateApis(
	'I acknowledge that using private APIs means my theme or plugin will inevitably break in the next version of WordPress.'
);

/** Records a raw Preact callback for the current attachment test. */
let observeRawCallback: ( owner: string, callback: string ) => void = () =>
	undefined;

/** Props read or composed by the directly registered test directive. */
type CallbackElementProps = {
	/** Label used to identify the element's callback observations. */
	'data-callback-owner'?: string;
	/** Ref assigned by the interactivity runtime. */
	ref?: ( ( node: Element | null ) => void ) | { current: Element | null };
};

/** Records a runtime-scoped layout effect for the current attachment test. */
let observeRuntimeLayoutEffect: ( owner: string ) => void = () => undefined;

/** Error thrown by the failure-path directive when its test enables it. */
let renderError: Error | undefined;

/**
 * Registers Preact callbacks directly from a directive, bypassing runtime scope
 * wrappers so attached-render behavior is observable at its boundary.
 */
const { cloneElement: cloneDirectiveElement, directive } = privateApis(
	'I acknowledge that using private APIs means my theme or plugin will inevitably break in the next version of WordPress.'
);
directive( 'test-callback-scope', ( { element } ) => {
	const elementProps = element.props as unknown as CallbackElementProps;
	const owner = String( elementProps[ 'data-callback-owner' ] ?? '' );
	usePreactEffect( () => {
		observeRawCallback( owner, 'effect' );
		return () => observeRawCallback( owner, 'effect-cleanup' );
	}, [] );
	usePreactLayoutEffect( () => {
		observeRawCallback( owner, 'layout-effect' );
		return () => observeRawCallback( owner, 'layout-cleanup' );
	}, [] );
	useRuntimeLayoutEffect( () => {
		observeRuntimeLayoutEffect( owner );
	}, [] );
	const existingRef = elementProps.ref;
	return cloneDirectiveElement( element, {
		ref: ( node: Element | null ) => {
			if ( typeof existingRef === 'function' ) {
				existingRef( node );
			} else if ( existingRef ) {
				existingRef.current = node;
			}
			observeRawCallback( owner, node ? 'ref' : 'ref-cleanup' );
		},
	} );
} );
directive( 'test-render-throw', () => {
	if ( renderError ) {
		throw renderError;
	}
} );

/**
 * Captures a scope reader's error without interrupting the remaining checks.
 *
 * @param callback Scope reader to invoke.
 * @return The thrown error message, or `undefined` when it returns.
 */
const captureScopeError = ( callback: () => unknown ) => {
	try {
		callback();
	} catch ( error ) {
		return error instanceof Error ? error.message : String( error );
	}
	return undefined;
};

/**
 * Reads all directive-scoped APIs from a raw Preact callback.
 *
 * @return Each error produced by running without a directive scope.
 */
const readScopeErrors = () => ( {
	context: captureScopeError( () => getContext() ),
	element: captureScopeError( () => getElement() ),
	serverContext: captureScopeError( () => getServerContext() ),
} );

// Stores, region signals and cached URLs persist for the lifetime of the module.
let testCount = 0;
// Namespace identifying the current test's independent regions and pages.
let namespace: string;
// Hydrated common region, updated on every navigation.
let current: Element;
// Persistent HTML owner outside the common region.
let htmlOwner: Element;
// Original inert content, which attachment must never alter.
let inertContent: string;
// Initial body markup for exact no-append comparisons during skipped renders.
let initialContent: string;
// Browser errors observed during the current test.
let errors: Event[];

/**
 * Records browser errors without suppressing their normal reporting.
 *
 * @param event Browser error or unhandled rejection event.
 * @return Number of recorded events.
 */
const recordError = ( event: Event ) => errors.push( event );

/**
 * Builds a region in the current namespace.
 *
 * @param id       Region id within the namespace.
 * @param content  Region content.
 * @param attachTo Optional attachment selector.
 * @return Interactive region markup.
 */
const regionHtml = ( id: string, content: string, attachTo?: string ) =>
	`<div data-wp-interactive="${ namespace }" data-wp-router-region='${ JSON.stringify(
		{
			// Signal key isolated from other tests.
			id: `${ namespace }/${ id }`,
			// Target resolved anew on each render.
			attachTo,
		}
	) }'>${ content }</div>`;

/**
 * Builds a titled page with the common region and an optional overlay.
 *
 * @param letter   Page title and common region content.
 * @param attachTo Optional overlay target; omission means no overlay.
 * @return Complete destination document.
 */
const destination = ( letter: string, attachTo?: string ) =>
	pageHtml(
		regionHtml( 's', `<p>${ letter }</p>` ) +
			( attachTo === undefined
				? ''
				: regionHtml(
						'o',
						`<p data-overlay>overlay ${ letter }</p>`,
						attachTo
					) )
	).replace( '<title>t</title>', `<title>${ letter }</title>` );

/**
 * Returns a unique page URL for this test.
 *
 * @param letter Page name.
 * @return Absolute URL.
 */
const pageUrl = ( letter: string ) =>
	`http://localhost/${ namespace }/${ letter }`;

/**
 * Navigates through the public action and lets directive effects finish.
 *
 * @param letter   Destination name.
 * @param attachTo Optional destination overlay target.
 * @return Promise resolving after navigation and scheduled effects.
 */
const navigate = async ( letter: string, attachTo?: string ) => {
	await expect(
		actions.navigate( pageUrl( letter ), {
			...quiet,
			html: destination( letter, attachTo ),
		} )
	).resolves.toBeUndefined();
	await nextFrames();
};

/**
 * Exercises the browser history API and the router's popstate listener.
 *
 * @param direction History traversal direction.
 * @return Promise resolving after traversal and router effects.
 */
const traverse = async ( direction: 'back' | 'forward' ) => {
	const popped = new Promise< void >( ( resolve ) =>
		window.addEventListener( 'popstate', () => resolve(), { once: true } )
	);
	window.history[ direction ]();
	await popped;
	await nextFrames();
};

/**
 * Checks the consumer-visible result of a completed page transition.
 *
 * @param letter Expected destination name.
 */
const expectPage = ( letter: string ) => {
	expect( current.innerHTML ).toBe( `<p>${ letter }</p>` );
	expect( document.title ).toBe( letter );
	expect( window.location.href ).toBe( pageUrl( letter ) );
	expect( state.url ).toBe( pageUrl( letter ) );
	expect( state.navigating ).toBe( false );
	expect( inertContent ).toBe( '<div class="target">inert</div>' );
	expect( htmlOwner.innerHTML ).toBe( inertContent );
	expect( errors ).toEqual( [] );
};

/**
 * Checks that only the common region changed, with no appended element anywhere.
 *
 * @param letter Expected destination name.
 */
const expectSkippedPage = ( letter: string ) => {
	expectPage( letter );
	expect( document.body.innerHTML ).toBe(
		initialContent.replace( '<p>A</p>', `<p>${ letter }</p>` )
	);
};

beforeAll( nextFrames );

beforeEach( async () => {
	// Attachment fragments are keyed by parent identity, including body itself.
	document.body.replaceWith( document.createElement( 'body' ) );
	namespace = `test/router-attach-${ ++testCount }`;
	store( namespace, {
		state: {
			// Trusted inserted HTML remains opaque to hydration and attachment.
			html: asDangerousHTML( '<div class="target">inert</div>' ),
		},
	} );
	errors = [];
	window.addEventListener( 'error', recordError );
	window.addEventListener( 'unhandledrejection', recordError );
	window.history.replaceState(
		{ wpInteractivityId: sessionId },
		'',
		pageUrl( 'A' )
	);
	document.title = 'A';
	current = hydrateHtml( regionHtml( 's', '<p>A</p>' ) );
	const island = hydrateHtml(
		`<section data-wp-interactive="${ namespace }"><div class="owner" data-wp-html="state.html"><div class="target">inert</div></div></section>`
	);
	htmlOwner = island.firstElementChild!;
	inertContent = htmlOwner.innerHTML;
	initialContent = document.body.innerHTML;
	// Fixtures hydrate after module initialization, so seed their initial page.
	await actions.prefetch( pageUrl( 'A' ), { html: destination( 'A' ) } );
} );

afterEach( () => {
	window.removeEventListener( 'error', recordError );
	window.removeEventListener( 'unhandledrejection', recordError );
	observeRawCallback = () => undefined;
	observeRuntimeLayoutEffect = () => undefined;
	renderError = undefined;
} );

describe( 'attachment targets', () => {
	for ( const selector of [ '.target', '.owner' ] ) {
		test( `attaches to the first usable match after inert ${ selector } matches`, async () => {
			const outside = document.createElement( 'div' );
			outside.className = selector.slice( 1 );
			document.body.appendChild( outside );
			const later = outside.cloneNode() as Element;
			document.body.appendChild( later );
			await navigate( 'B', selector );
			expectPage( 'B' );
			const expected = document.createElement( 'div' );
			expected.innerHTML = regionHtml(
				'o',
				'<p data-overlay>overlay B</p>',
				selector
			);
			expect( outside.innerHTML ).toBe( expected.innerHTML );
			expect( later ).toBeEmptyDOMElement();
			expect(
				document.querySelectorAll( '[data-overlay]' )
			).toHaveLength( 1 );
		} );
	}

	for ( const selector of [ '#missing', '.target', '.owner', '[[' ] ) {
		test( `completes navigation and cached Back/Forward without an unusable ${ selector } attachment, then attaches once`, async () => {
			await navigate( 'B', selector );
			expectSkippedPage( 'B' );
			expect(
				document.querySelectorAll( '[data-overlay]' )
			).toHaveLength( 0 );
			await traverse( 'back' );
			expectSkippedPage( 'A' );
			await traverse( 'forward' );
			expectSkippedPage( 'B' );
			await navigate( 'C' );
			expectSkippedPage( 'C' );
			await traverse( 'back' );
			expectSkippedPage( 'B' );
			await traverse( 'forward' );
			expectSkippedPage( 'C' );
			expect(
				document.querySelectorAll( '[data-overlay]' )
			).toHaveLength( 0 );
			// Control: a region attached on its first attempt, to compare with
			// the retried attachment below.
			await actions.navigate( pageUrl( 'control' ), {
				...quiet,
				html: pageHtml(
					regionHtml( 's', '<p>control</p>' ) +
						regionHtml(
							'direct',
							'<p data-overlay>overlay D</p>',
							'body'
						)
				),
			} );
			await nextFrames();
			const directContent =
				document.querySelector( '[data-overlay]' )!.parentElement!
					.innerHTML;
			await navigate( 'D', 'body' );
			expectPage( 'D' );
			const overlays = document.querySelectorAll( '[data-overlay]' );
			expect( overlays ).toHaveLength( 1 );
			expect( overlays[ 0 ].parentElement!.innerHTML ).toBe(
				directContent
			);
			expect(
				overlays[ 0 ].closest( '[data-wp-router-region]' )!
					.parentElement
			).toBe( document.body );
		} );

		test( `clears an earlier attachment when its destination target ${ selector } is unusable, like an absent region`, async () => {
			await navigate( 'D', 'body' );
			expectPage( 'D' );
			expect(
				document.querySelectorAll( '[data-overlay]' )
			).toHaveLength( 1 );
			await navigate( 'C' );
			expectPage( 'C' );
			const absentContent = document.body.innerHTML;
			await navigate( 'B', selector );
			expectPage( 'B' );
			expect( document.body.innerHTML ).toBe(
				absentContent.replace( '<p>C</p>', '<p>B</p>' )
			);
			expect(
				document.querySelectorAll( '[data-overlay]' )
			).toHaveLength( 0 );
		} );
	}

	for ( const selector of [ '#missing', '.target' ] ) {
		test( `resolves cached ${ selector } attachments again when the live target becomes usable`, async () => {
			await navigate( 'B', selector );
			expectSkippedPage( 'B' );
			await navigate( 'C' );
			expectSkippedPage( 'C' );
			const target = document.createElement( 'div' );
			if ( selector === '#missing' ) {
				target.id = 'missing';
			} else {
				target.className = 'target';
			}
			document.body.appendChild( target );
			await traverse( 'back' );
			expectPage( 'B' );
			expect( target.children ).toHaveLength( 1 );
			expect( target.firstElementChild!.innerHTML ).toBe(
				'<p data-overlay="">overlay B</p>'
			);
			await traverse( 'forward' );
			expectPage( 'C' );
			expect( target ).toBeEmptyDOMElement();
		} );
	}
} );

describe( 'scope during attached rendering', () => {
	test( 'isolates Preact callbacks and preserves element bindings during attachment updates', async () => {
		vi.stubGlobal( 'SCRIPT_DEBUG', true );

		const trigger = hydrateTrigger( 'r1' );
		const contextNamespace = namespace;
		const initialUrl = window.location.href;
		const callbackReadings: Array< {
			owner: string;
			callback: string;
			errors: ReturnType< typeof readScopeErrors >;
			href: string;
		} > = [];
		const runtimeReadings: Array< {
			callback: string;
			owner: string;
		} > = [];
		const watchCleanupReadings: Array< {
			owner: string;
			contextError: string | undefined;
			href: string;
			stateUrl: string;
		} > = [];
		const initCleanupReadings: Array< {
			owner: string;
			contextError: string | undefined;
			href: string;
			stateUrl: string;
		} > = [];
		const scopedCleanupReadings: Array< {
			owner: string;
			href: string;
		} > = [];
		/**
		 * Adds a direct-callback element for the named owner.
		 *
		 * @param owner Element label read by its registered directive.
		 * @return The directive element markup.
		 */
		const rawCallbackRegion = ( owner: string ) =>
			`<span data-wp-test-callback-scope data-callback-owner="${ owner }"></span>`;
		/**
		 * Builds one attached region's callback and runtime directive content.
		 *
		 * @param owner Element context label.
		 * @return The region's child markup.
		 */
		const content = ( owner: string ) =>
			`<section data-wp-context='{"owner":"${ owner }"}'>${ rawCallbackRegion(
				owner
			) }<span data-wp-watch="callbacks.watch"></span><span data-wp-watch="callbacks.scopedWatch"></span><span data-wp-init="callbacks.init"></span></section>`;

		observeRawCallback = ( owner, callback ) =>
			callbackReadings.push( {
				owner,
				callback,
				errors: readScopeErrors(),
				href: window.location.href,
			} );
		observeRuntimeLayoutEffect = ( owner ) =>
			( () => {
				const contextOwner = getContext< { owner: string } >(
					contextNamespace
				).owner;
				expect( contextOwner ).toBe( owner );
				runtimeReadings.push( {
					callback: 'layout-effect',
					owner: contextOwner,
				} );
			} )();
		store( namespace, {
			callbacks: {
				watch() {
					const owner = getContext< { owner: string } >(
						contextNamespace
					).owner;
					runtimeReadings.push( { callback: 'watch', owner } );
					return () =>
						watchCleanupReadings.push( {
							owner,
							contextError: captureScopeError( () =>
								getContext()
							),
							href: window.location.href,
							stateUrl: state.url,
						} );
				},
				scopedWatch() {
					return withScope( () =>
						scopedCleanupReadings.push( {
							owner: getContext< { owner: string } >(
								contextNamespace
							).owner,
							href: window.location.href,
						} )
					);
				},
				init() {
					const owner = getContext< { owner: string } >(
						contextNamespace
					).owner;
					runtimeReadings.push( { callback: 'init', owner } );
					return () =>
						initCleanupReadings.push( {
							owner,
							contextError: captureScopeError( () =>
								getContext()
							),
							href: window.location.href,
							stateUrl: state.url,
						} );
				},
			},
		} );

		const firstHref = pageUrl( 'scope-b' );
		await trigger.runInScope( () =>
			actions.navigate( firstHref, {
				...quiet,
				html: pageHtml(
					regionHtml( 's', '<p>B</p>' ) +
						regionHtml( 'o', content( 'old' ), 'body' )
				),
			} )
		);
		await nextFrames();

		const secondTrigger = hydrateTrigger( 'r2' );
		const callbackOffset = callbackReadings.length;
		const previousUrl = window.location.href;
		const secondHref = pageUrl( 'scope-c' );
		await secondTrigger.runInScope( () =>
			actions.navigate( secondHref, {
				...quiet,
				html: pageHtml(
					regionHtml( 's', '<p>C</p>' ) +
						regionHtml( 'o', '<p>replaced</p>', 'body' ) +
						regionHtml( 'x', content( 'new' ), 'body' )
				),
			} )
		);
		await nextFrames();

		const attachedCallbacks = callbackReadings.slice( callbackOffset );
		const expectedNoScopeErrors = {
			context: expect.stringContaining(
				'Cannot call `getContext()` when there is no scope.'
			),
			element: expect.stringContaining(
				'Cannot call `getElement()` when there is no scope.'
			),
			serverContext: expect.stringContaining(
				'Cannot call `getServerContext()` when there is no scope.'
			),
		};
		expect( callbackReadings.map( ( { callback } ) => callback ) ).toEqual(
			expect.arrayContaining( [ 'ref', 'layout-effect', 'effect' ] )
		);
		expect(
			callbackReadings.map(
				( { owner, callback } ) => `${ owner }:${ callback }`
			)
		).toEqual(
			expect.arrayContaining( [
				'old:effect',
				'old:effect-cleanup',
				'new:effect',
			] )
		);
		expect(
			attachedCallbacks
				.filter( ( { callback } ) =>
					[
						'layout-cleanup',
						'ref-cleanup',
						'ref',
						'layout-effect',
					].includes( callback )
				)
				.map( ( { callback } ) => callback )
		).toEqual( [
			'layout-cleanup',
			'ref-cleanup',
			'ref',
			'layout-effect',
		] );
		for ( const reading of attachedCallbacks.filter( ( { callback } ) =>
			[
				'layout-cleanup',
				'ref-cleanup',
				'ref',
				'layout-effect',
			].includes( callback )
		) ) {
			expect( reading.href ).toBe( previousUrl );
		}
		for ( const reading of callbackReadings ) {
			expect( reading.errors ).toEqual( expectedNoScopeErrors );
		}
		expect( window.location.href ).toBe( secondHref );
		expect( previousUrl ).toBe( firstHref );
		expect( initialUrl ).not.toBe( previousUrl );
		expect( runtimeReadings ).toEqual(
			expect.arrayContaining( [
				{ callback: 'watch', owner: 'old' },
				{ callback: 'init', owner: 'old' },
				{ callback: 'layout-effect', owner: 'old' },
				{ callback: 'watch', owner: 'new' },
				{ callback: 'init', owner: 'new' },
				{ callback: 'layout-effect', owner: 'new' },
			] )
		);
		expect( watchCleanupReadings ).toEqual(
			expect.arrayContaining( [
				{
					owner: 'old',
					contextError: expect.stringContaining(
						'Cannot call `getContext()` when there is no scope.'
					),
					href: previousUrl,
					stateUrl: secondHref,
				},
			] )
		);
		expect( initCleanupReadings ).toEqual(
			expect.arrayContaining( [
				{
					owner: 'old',
					contextError: expect.stringContaining(
						'Cannot call `getContext()` when there is no scope.'
					),
					href: previousUrl,
					stateUrl: secondHref,
				},
			] )
		);
		expect( scopedCleanupReadings ).toEqual(
			expect.arrayContaining( [
				{ owner: 'old', href: expect.any( String ) },
			] )
		);
	} );

	test( 'cleans up attached init callbacks without scope when their cleanup starts a navigation', async () => {
		vi.stubGlobal( 'SCRIPT_DEBUG', true );

		const trigger = hydrateTrigger( 'cleanup-r1' );
		const initRuns: string[] = [];
		const cleanupReadings: Array< {
			contextError: string | undefined;
			initiator: unknown;
		} > = [];
		let cleanupNavigation: Promise< void > | undefined;
		store( namespace, {
			callbacks: {
				navigateOnCleanup() {
					initRuns.push( 'mounted' );
					return () => {
						cleanupNavigation = actions.navigate(
							pageUrl( 'cleanup-navigation' ),
							{
								...quiet,
								html: pageHtml(
									regionHtml( 's', '<p>cleanup</p>' )
								),
							}
						);
						cleanupReadings.push( {
							contextError: captureScopeError( () =>
								getContext()
							),
							initiator: state.initiator,
						} );
					};
				},
			},
		} );

		await trigger.runInScope( () =>
			actions.navigate( pageUrl( 'init-b' ), {
				...quiet,
				html: pageHtml(
					regionHtml( 's', '<p>B</p>' ) +
						regionHtml(
							'o',
							'<span data-wp-init="callbacks.navigateOnCleanup"></span>',
							'body'
						)
				),
			} )
		);
		await nextFrames();
		expect( initRuns ).toEqual( [ 'mounted' ] );

		const secondTrigger = hydrateTrigger( 'cleanup-r2' );
		await secondTrigger.runInScope( () =>
			actions.navigate( pageUrl( 'init-c' ), {
				...quiet,
				html: pageHtml(
					regionHtml( 's', '<p>C</p>' ) +
						regionHtml( 'o', '<p>replaced</p>', 'body' ) +
						regionHtml( 'x', '<p>new</p>', 'body' )
				),
			} )
		);
		await cleanupNavigation;
		await nextFrames();

		expect( initRuns ).toEqual( [ 'mounted' ] );
		expect( cleanupReadings ).toEqual( [
			{
				contextError: expect.stringContaining(
					'Cannot call `getContext()` when there is no scope.'
				),
				initiator: null,
			},
		] );
	} );

	test( 'leaves no scope behind when a directive throws during an attached render', async () => {
		vi.stubGlobal( 'SCRIPT_DEBUG', true );

		const triggerNamespace = `${ namespace }/trigger`;
		const triggerOwner = 'trigger';
		const throwerOwner = 'thrower';
		let navigation: Promise< void > | undefined;
		let thrown: unknown;
		store( triggerNamespace, {
			actions: {
				navigateToThrowingPage() {
					try {
						navigation = actions.navigate( pageUrl( 'throwing' ), {
							...quiet,
							html: pageHtml(
								regionHtml( 's', '<p>throwing</p>' ) +
									regionHtml(
										'o',
										`<span data-wp-context='{"owner":"${ throwerOwner }"}' data-wp-test-render-throw></span>`,
										'body'
									)
							),
						} );
					} catch ( error ) {
						thrown = error;
					}
				},
			},
		} );
		hydrateHtml(
			`<div data-wp-interactive="${ triggerNamespace }" data-wp-router-region='throw-r1' data-wp-context='{"owner":"${ triggerOwner }"}'><button data-wp-on--click="actions.navigateToThrowingPage"></button></div>`
		);
		renderError = new Error( 'Attached directive failed' );

		// Preact may log a development warning about the failing render; it is
		// not what this test observes.
		vi.stubGlobal( 'console', { ...console, warn: () => undefined } );
		document
			.querySelector< HTMLButtonElement >(
				`[data-wp-interactive="${ triggerNamespace }"] button`
			)!
			.click();
		const navigationError = navigation
			? await navigation.then(
					() => undefined,
					( error ) => error
				)
			: thrown;
		expect( navigationError ).toBe( renderError );

		const readings = await new Promise< {
			trigger: string | undefined;
			thrower: string | undefined;
			element: string | undefined;
		} >( ( resolve ) =>
			setTimeout( () =>
				resolve( {
					trigger: captureScopeError( () =>
						getContext( triggerNamespace )
					),
					thrower: captureScopeError( () => getContext( namespace ) ),
					element: captureScopeError( () => getElement() ),
				} )
			)
		);
		const noScope = ( method: string ) =>
			expect.stringContaining(
				`Cannot call \`${ method }()\` when there is no scope.`
			);
		expect( readings ).toEqual( {
			trigger: noScope( 'getContext' ),
			thrower: noScope( 'getContext' ),
			element: noScope( 'getElement' ),
		} );
		expect( getCurrentScope() ).toBeUndefined();
	} );
} );
