/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
import warn from '@wordpress/warning';

/**
 * Internal dependencies
 */
import { compiler } from '../system';

const { cache } = compiler;

/**
 * @typedef StyleFrameProviderProps
 * @property {import('react').ReactNode} children Children elements to render.
 */

/**
 * A special Provider designed specifically for iFrame usage.
 * Components using the style system's styled that render within will have their
 * styles injected and rendered correctly within the iFrame out-of-the-box.
 *
 * No external stylesheet loading is necessary when using <StyleFrameProvider />.
 *
 * @example
 * ```jsx
 * <Frame>
 *   <StyleFrameProvider>
 *     <Button>Code is Poetry</Button>
 *   </StyleFrameProvider>
 * </Frame>
 * ```
 *
 * @param {StyleFrameProviderProps} props Props for the Provider.
 */
export function StyleFrameProvider( { children } ) {
	const ref = useRef( null );
	useEmotionSheetInsert( { ref } );
	useEmotionInitialTagSync( { ref } );

	/**
	 * Rendering the contents within a <div /> in order for React
	 * to retrieve the correct Frame.document (via ownerDocument.)
	 */
	return <div ref={ ref }>{ children }</div>;
}

/**
 * Initially syncs existing Emotion tags (from cache) into the Frame head by
 * cloning and injecting the tags into the DOM.
 *
 * @param {Object} options
 * @param {import('react').RefObject<Node>} options.ref
 */
function useEmotionInitialTagSync( { ref } ) {
	useEffect( () => {
		const ownerDocument = ref.current?.ownerDocument;
		if ( ! ownerDocument ) return;

		const head = ownerDocument.querySelector( 'head' );

		try {
			/**
			 * Account for compiler (Emotion) isSpeedy rendering, which occurs
			 * for production builds.
			 */
			// @ts-ignore isSpeedy is an unexposed property
			if ( cache.sheet.isSpeedy ) {
				let speedyTag = cache.sheet.tags[ 0 ];
				/**
				 * Locate the styleSheet instance within document.styleSheet
				 * based on the speed (style) tag match.
				 */
				const speedySheet = Object.values( document.styleSheets ).find(
					( sheet ) => sheet.ownerNode === speedyTag
				);
				if ( speedySheet ) {
					/**
					 * The compiler's speedy mode inserts the cssRule directly
					 * into the styleSheet instance, rather than as a textNode in
					 * a style tag. We can retrieve this via the styleSheet instance
					 * cssRule.
					 */
					const initialStyles = Object.values( speedySheet.cssRules )
						.map( ( cssRule ) => cssRule.cssText )
						.join( '\n' );

					/**
					 * Clone the speed style tag, and append it into the target (frame)
					 * document head.
					 */
					// @ts-ignore cloneNode type is weak
					speedyTag = speedyTag.cloneNode( true );
					speedyTag.innerHTML = initialStyles;

					if ( head ) {
						head.appendChild( speedyTag );
					}
				}
			} else if ( cache.sheet.tags ) {
				/**
				 * Otherwise, loop through all of the cache sheet tags, and clone
				 * them into the targeted (frame) document head.
				 */
				cache.sheet.tags.forEach( ( tag ) => {
					if ( head ) {
						head.appendChild( tag.cloneNode( true ) );
					}
				} );
			}
		} catch ( e ) {
			warn(
				`There was a problem syncing Style rules from window.document. ${ e }`
			);
		}
	}, [ ref ] );
}

/**
 * Inserts individual rules compiled by Emotion into the Frame's
 * document.styleSheet object by using the same technique as Emotion's
 * sheet class.
 *
 * @param {Object} props
 * @param {import('react').RefObject<HTMLElement>} props.ref
 */
function useEmotionSheetInsert( { ref } ) {
	/**
	 * The following insert code is found in Emotion's sheet class, specifically,
	 * the insert method. We're replicating that functionality to insert
	 * the style rules into the Frame's container (document.head).
	 *
	 * https://github.com/emotion-js/emotion/blob/master/packages/sheet/src/index.js
	 */
	useEffect( () => {
		const ownerDocument = ref.current?.ownerDocument;
		if ( ! ownerDocument ) return;

		const head = ownerDocument.querySelector( 'head' );

		if ( ! head ) {
			return;
		}

		const sheetForTag = () => {
			let tag = head.querySelector( 'style[data-style-system-frame]' );

			if ( ! tag ) {
				tag = ownerDocument.createElement( 'style' );
				tag.setAttribute( 'data-style-system-frame', 'true' );
				head.appendChild( tag );
			}

			const sheet = /** @type {HTMLStyleElement} */ ( tag ).sheet;

			if ( sheet ) {
				return sheet;
			}

			// this weirdness brought to you by firefox
			for ( let i = 0; i < ownerDocument.styleSheets.length; i++ ) {
				if ( ownerDocument.styleSheets[ i ].ownerNode === tag ) {
					return ownerDocument.styleSheets[ i ];
				}
			}

			throw new Error( 'Unable to find sheet for tag' );
		};

		const renderStyleRule = ( /** @type {string | undefined} */ rule ) => {
			if ( ! rule ) {
				return;
			}
			try {
				const sheet = sheetForTag();
				// this is a really hot path
				// we check the second character first because having "i"
				// as the second character will happen less often than
				// having "@" as the first character
				const isImportRule =
					rule.charCodeAt( 1 ) === 105 && rule.charCodeAt( 0 ) === 64;
				// this is the ultrafast version, works across browsers
				// the big drawback is that the css won't be editable in devtools
				sheet.insertRule(
					rule,
					// we need to insert @import rules before anything else
					// otherwise there will be an error
					// technically this means that the @import rules will
					// _usually_(not always since there could be multiple style tags)
					// be the first ones in prod and generally later in dev
					// this shouldn't really matter in the real world though
					// @import is generally only used for font faces from google fonts and etc.
					// so while this could be technically correct then it would be slower and larger
					// for a tiny bit of correctness that won't matter in the real world
					isImportRule ? 0 : sheet.cssRules.length
				);
			} catch ( e ) {
				warn(
					`There was a problem inserting the following rule: "${ rule }", ${ e }`
				);
			}
		};

		/**
		 * The compiler (Emotion) has a special event emitter (pub/sub) that emits
		 * an event whenever the compiler sheet inserts a rule.
		 *
		 * We're subscribing to these events in order to sync the insertion from
		 * the primary Emotion document (window) to the Frame document.
		 */
		compiler.__events.on( 'sheet.insert', renderStyleRule );

		return () => {
			/**
			 * Unsubscribe to the events.
			 */
			compiler.__events.off( 'sheet.insert', renderStyleRule );
		};
	}, [ ref ] );
}
