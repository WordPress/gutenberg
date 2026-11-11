import type {
	AnchorHTMLAttributes,
	ComponentProps,
	MouseEvent,
	ReactNode,
} from 'react';
import {
	createContext,
	useContext,
	useEffect,
	useId,
	useRef,
	useState,
} from '@wordpress/element';
import { isRTL } from '@wordpress/i18n';
import { chevronLeft, chevronRight } from '@wordpress/icons';
import { __dangerousOptInToUnstableAPIsOnlyForCoreModules } from '@wordpress/private-apis';
import {
	Link as RouterLink,
	privateApis as routePrivateApis,
} from '@wordpress/route';
import { Badge, ButtonLink, Icon, Text } from '@wordpress/ui';
import styles from './style.module.css';

const { unlock } = __dangerousOptInToUnstableAPIsOnlyForCoreModules(
	'I acknowledge private features are not for use in themes or plugins and doing so will break in the next version of WordPress.',
	'@wordpress/storybook'
);

const {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	parseHref,
	RouterProvider,
	useBlocker,
	useLocation,
} = unlock( routePrivateApis );

type NavigationType = 'PUSH' | 'REPLACE';

type Blocker = {
	blockerFn: ( args: {
		currentLocation: unknown;
		nextLocation: unknown;
		action: NavigationType;
	} ) => boolean | Promise< boolean >;
	enableBeforeUnload?: boolean | ( () => boolean );
};

type Navigate = (
	path: string,
	state: unknown,
	navigateOpts?: { ignoreBlocker?: boolean }
) => void;

/**
 * An in-memory history, so examples navigate inside the canvas without
 * touching the URL. TanStack's memory history ignores blockers, unlike the
 * browser history admin pages use, so this one runs them itself.
 */
function createBlockingMemoryHistory( initialPath: string ) {
	const history = createMemoryHistory( { initialEntries: [ initialPath ] } );
	let blockers: Blocker[] = [];

	const isBlocked = async (
		action: NavigationType,
		path: string,
		state: unknown
	) => {
		for ( const blocker of blockers ) {
			if (
				await blocker.blockerFn( {
					currentLocation: history.location,
					nextLocation: parseHref( path, state ),
					action,
				} )
			) {
				return true;
			}
		}
		return false;
	};

	const guard =
		( action: NavigationType, navigate: Navigate ): Navigate =>
		async ( path, state, navigateOpts ) => {
			if (
				navigateOpts?.ignoreBlocker ||
				! ( await isBlocked( action, path, state ) )
			) {
				navigate( path, state, navigateOpts );
			}
		};

	const onBeforeUnload = ( event: BeforeUnloadEvent ) => {
		const shouldWarn = blockers.some( ( { enableBeforeUnload = true } ) =>
			typeof enableBeforeUnload === 'function'
				? enableBeforeUnload()
				: enableBeforeUnload
		);
		if ( shouldWarn ) {
			event.preventDefault();
		}
	};

	history.push = guard( 'PUSH', history.push );
	history.replace = guard( 'REPLACE', history.replace );
	history.block = ( blocker: Blocker ) => {
		blockers = [ ...blockers, blocker ];
		window.addEventListener( 'beforeunload', onBeforeUnload );
		return () => {
			blockers = blockers.filter( ( item ) => item !== blocker );
			if ( ! blockers.length ) {
				window.removeEventListener( 'beforeunload', onBeforeUnload );
			}
		};
	};

	return history;
}

// `useBlocker` re-registers whenever its options change identity, which
// re-renders the router, so they must stay stable between renders.
const alwaysBlock = () => true;

/**
 * Holds navigation while `isDirty` is true, so the page can ask before its
 * draft is lost. Leaving the app (reloading or closing the tab) falls back to
 * the browser's own warning, which can't be customized.
 */
export function useNavigationBlocker( isDirty: boolean ) {
	return useBlocker( {
		shouldBlockFn: alwaysBlock,
		enableBeforeUnload: true,
		disabled: ! isDirty,
		withResolver: true,
	} );
}

const ScreenContext = createContext< ReactNode >( null );

/**
 * Places focus after navigating, since the page that held the activated link
 * is replaced and focus would otherwise fall back to the document. A link in
 * navigation the new page also has, like the section navigation, hands focus
 * to that navigation's current item. Any other link, like a breadcrumb or a
 * subpage row, hands it to the new page's heading, so screen readers announce
 * the page.
 */
function useFocusAfterNavigate() {
	const containerRef = useRef< HTMLDivElement >( null );
	const activatedNavigationRef = useRef< string | null >( null );
	const { pathname } = useLocation();
	const previousPathnameRef = useRef( pathname );

	useEffect( () => {
		if ( previousPathnameRef.current === pathname ) {
			return;
		}
		previousPathnameRef.current = pathname;
		const container = containerRef.current;
		const { activeElement } = container?.ownerDocument ?? document;
		if ( ! container || container.contains( activeElement ) ) {
			return;
		}
		const navigationLabel = activatedNavigationRef.current;
		const currentItem = navigationLabel
			? container.querySelector< HTMLElement >(
					`nav[aria-label="${ CSS.escape(
						navigationLabel
					) }"] [aria-current="page"]`
				)
			: null;
		if ( currentItem ) {
			currentItem.focus();
			return;
		}
		const heading = container.querySelector( 'h1' );
		heading?.setAttribute( 'tabindex', '-1' );
		heading?.focus();
	}, [ pathname ] );

	// Clicks that aren't on a link, like confirming a discard prompt, keep the
	// link that started the navigation.
	const onClickCapture = ( event: MouseEvent< HTMLDivElement > ) => {
		const link = ( event.target as Element ).closest( 'a' );
		if ( link ) {
			activatedNavigationRef.current =
				link.closest( 'nav' )?.getAttribute( 'aria-label' ) ?? null;
		}
	};

	return { ref: containerRef, onClickCapture };
}

function Screen() {
	const containerProps = useFocusAfterNavigate();
	return (
		<div { ...containerProps } className={ styles.screen }>
			{ useContext( ScreenContext ) }
		</div>
	);
}

function createSettingsRouter( initialPath: string ) {
	// The screen renders from the root route, so it stays mounted (and keeps
	// its state) while the child routes only make every path a match.
	const rootRoute = createRootRoute( { component: Screen } );
	const routeTree = rootRoute.addChildren( [
		createRoute( {
			getParentRoute: () => rootRoute,
			path: '/',
			component: () => null,
		} ),
		createRoute( {
			getParentRoute: () => rootRoute,
			path: '$',
			component: () => null,
		} ),
	] );
	return createRouter( {
		routeTree,
		history: createBlockingMemoryHistory( initialPath ),
		defaultNotFoundComponent: () => null,
	} );
}

/**
 * Gives an example an in-memory router, so `Breadcrumbs`, `Page` navigation
 * and subpage links navigate inside the canvas without touching the URL.
 */
export function SettingsRouter( {
	initialPath = '/',
	children,
}: {
	initialPath?: string;
	children: ReactNode;
} ) {
	const [ router ] = useState( () => createSettingsRouter( initialPath ) );
	return (
		<ScreenContext.Provider value={ children }>
			<RouterProvider router={ router } />
		</ScreenContext.Provider>
	);
}

export function useSettingsPath(): string {
	return useLocation().pathname;
}

/**
 * Passed to `Page` as `components.link`, so the section navigation routes
 * through the router instead of reloading the page.
 */
export function RouterNavLink( {
	href,
	...props
}: AnchorHTMLAttributes< HTMLAnchorElement > & { href: string } ) {
	return <RouterLink to={ href } { ...props } />;
}

export type SubpageStatus = {
	label: string;
	intent?: ComponentProps< typeof Badge >[ 'intent' ];
};

/**
 * Opens a subpage from the page body, as a full-width row. It is a link
 * because it changes location; the trailing chevron signals that it
 * navigates. The link is named by its label alone, which matches the
 * subpage's heading, and the status badge describes it.
 */
export function SubpageLink( {
	to,
	status,
	children,
}: {
	to: string;
	status?: SubpageStatus;
	children: ReactNode;
} ) {
	const labelId = useId();
	const statusId = useId();
	return (
		<ButtonLink
			variant="unstyled"
			className={ styles[ 'subpage-link' ] }
			render={ <RouterLink to={ to } /> }
			aria-labelledby={ labelId }
			aria-describedby={ status ? statusId : undefined }
		>
			<Text
				id={ labelId }
				variant="body-md"
				className={ styles[ 'subpage-label' ] }
			>
				{ children }
			</Text>
			{ status && (
				<Badge id={ statusId } intent={ status.intent }>
					{ status.label }
				</Badge>
			) }
			<Icon icon={ isRTL() ? chevronLeft : chevronRight } />
		</ButtonLink>
	);
}
