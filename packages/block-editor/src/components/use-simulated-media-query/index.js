/**
 * External dependencies
 */
import { filter } from 'lodash';
import { match } from 'css-mediaquery';

/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { getProtocol, getAuthority } from '@wordpress/url';

const ENABLED_MEDIA_QUERY = '(min-width:0px)';
const DISABLED_MEDIA_QUERY = '(min-width:999999px)';

const VALID_MEDIA_QUERY_REGEX = /\((min|max)-width:[^\(]*?\)/g;

function getStyleSheetsThatMatchHostname() {
	if ( typeof window === 'undefined' ) {
		return [];
	}

	return filter( window?.document?.styleSheets ?? [], ( styleSheet ) => {
		if ( ! styleSheet.href ) {
			return false;
		}
		return (
			getProtocol( styleSheet.href ) === window.location.protocol &&
			getAuthority( styleSheet.href ) === window.location.host
		);
	} );
}

function isReplaceableMediaRule( rule ) {
	if ( ! rule.media ) {
		return false;
	}
	// Need to use "media.mediaText" instead of "conditionText" for IE support.
	return !! rule.media.mediaText.match( VALID_MEDIA_QUERY_REGEX );
}

function replaceRule( styleSheet, newRuleText, index ) {
	styleSheet.deleteRule( index );
	styleSheet.insertRule( newRuleText, index );
}

function replaceMediaQueryWithWidthEvaluation( ruleText, widthValue ) {
	return ruleText.replace( VALID_MEDIA_QUERY_REGEX, ( matchedSubstring ) => {
		if (
			match( matchedSubstring, {
				type: 'screen',
				width: widthValue,
			} )
		) {
			return ENABLED_MEDIA_QUERY;
		}
		return DISABLED_MEDIA_QUERY;
	} );
}

/**
 * Function that manipulates media queries from stylesheets to simulate a given
 * viewport width.
 *
 * @param {string}  marker CSS selector string defining start and end of
 *                         manipulable styles.
 * @param {number?} width  Viewport width to simulate. If provided null, the
 *                         stylesheets will not be modified.
 */
export default function useSimulatedMediaQuery( marker, width ) {
	useEffect( () => {
		if ( ! width ) {
			return;
		}

		const styleSheets = getStyleSheetsThatMatchHostname();
		const originalStyles = [];
		styleSheets.forEach( ( styleSheet, styleSheetIndex ) => {
			let relevantSection = false;
			for (
				let ruleIndex = 0;
				ruleIndex < styleSheet.cssRules.length;
				++ruleIndex
			) {
				const rule = styleSheet.cssRules[ ruleIndex ];
				if (
					rule.type !== window.CSSRule.STYLE_RULE &&
					rule.type !== window.CSSRule.MEDIA_RULE
				) {
					continue;
				}

				if (
					! relevantSection &&
					!! rule.cssText.match( new RegExp( `#start-${ marker }` ) )
				) {
					relevantSection = true;
				}

				if (
					relevantSection &&
					!! rule.cssText.match( new RegExp( `#end-${ marker }` ) )
				) {
					relevantSection = false;
				}

				if ( ! relevantSection || ! isReplaceableMediaRule( rule ) ) {
					continue;
				}
				const ruleText = rule.cssText;
				if ( ! originalStyles[ styleSheetIndex ] ) {
					originalStyles[ styleSheetIndex ] = [];
				}
				originalStyles[ styleSheetIndex ][ ruleIndex ] = ruleText;
				replaceRule(
					styleSheet,
					replaceMediaQueryWithWidthEvaluation( ruleText, width ),
					ruleIndex
				);
			}
		} );
		return () => {
			originalStyles.forEach( ( rulesCollection, styleSheetIndex ) => {
				if ( ! rulesCollection ) {
					return;
				}
				for (
					let ruleIndex = 0;
					ruleIndex < rulesCollection.length;
					++ruleIndex
				) {
					const originalRuleText = rulesCollection[ ruleIndex ];
					if ( originalRuleText ) {
						replaceRule(
							styleSheets[ styleSheetIndex ],
							originalRuleText,
							ruleIndex
						);
					}
				}
			} );
		};
	}, [ width ] );
}
