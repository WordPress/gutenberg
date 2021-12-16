/**
 * External dependencies
 */
import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';
import a11yPlugin from 'colord/plugins/a11y';

/**
 * WordPress dependencies
 */
import { useCallback, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import transformStyles from '../../utils/transform-styles';

const EDITOR_STYLES_SELECTOR = '.editor-styles-wrapper';
extend( [ namesPlugin, a11yPlugin ] );

function useDarkThemeBodyClassName( styles ) {
	return useCallback(
		( node ) => {
			if ( ! node ) {
				return;
			}

			const { ownerDocument } = node;
			const { defaultView, body } = ownerDocument;
			const canvas = ownerDocument.querySelector(
				EDITOR_STYLES_SELECTOR
			);

			let backgroundColor;

			if ( ! canvas ) {
				// The real .editor-styles-wrapper element might not exist in the
				// DOM, so calculate the background color by creating a fake
				// wrapper.
				const tempCanvas = ownerDocument.createElement( 'div' );
				tempCanvas.classList.add( 'editor-styles-wrapper' );
				body.appendChild( tempCanvas );

				backgroundColor = defaultView
					.getComputedStyle( tempCanvas, null )
					.getPropertyValue( 'background-color' );

				body.removeChild( tempCanvas );
			} else {
				backgroundColor = defaultView
					.getComputedStyle( canvas, null )
					.getPropertyValue( 'background-color' );
			}
			const colordBackgroundColor = colord( backgroundColor );
			// If background is transparent, it should be treated as light color.
			if (
				colordBackgroundColor.luminance() > 0.5 ||
				colordBackgroundColor.alpha() === 0
			) {
				body.classList.remove( 'is-dark-theme' );
			} else {
				body.classList.add( 'is-dark-theme' );
			}
		},
		[ styles ]
	);
}

function useParsedAssets( html ) {
	return useMemo( () => {
		const doc = document.implementation.createHTMLDocument( '' );
		doc.body.innerHTML = html;
		return Array.from( doc.body.children );
	}, [ html ] );
}

function PrefixedStyle( { tagName, href, id, rel, media, textContent } ) {
	const TagName = tagName.toLowerCase();

	function onLoad( event ) {
		const { sheet } = event.target;
		const { cssRules } = sheet;

		let index = 0;

		for ( const rule of cssRules ) {
			const { type, STYLE_RULE, selectorText, cssText } = rule;

			if ( type !== STYLE_RULE ) {
				continue;
			}

			if ( selectorText.includes( EDITOR_STYLES_SELECTOR ) ) {
				return;
			}

			sheet.deleteRule( index );
			sheet.insertRule(
				'html :where(.editor-styles-wrapper) ' + cssText,
				index
			);

			index++;
		}
	}

	if ( TagName === 'style' ) {
		return <TagName { ...{ id, onLoad } }>{ textContent }</TagName>;
	}

	return <TagName { ...{ href, id, rel, media, onLoad } } />;
}

export default function EditorStyles( {
	styles,
	__unstableResolvedContentStyles,
} ) {
	const _styles = useParsedAssets( __unstableResolvedContentStyles );
	const transformedStyles = useMemo(
		() => transformStyles( styles, EDITOR_STYLES_SELECTOR ),
		[ styles ]
	);

	return (
		<>
			{ /* Use an empty style element to have a document reference,
			     but this could be any element. */ }
			<style ref={ useDarkThemeBodyClassName( styles ) } />
			{ _styles.map(
				( { tagName, href, id, rel, media, textContent } ) => (
					<PrefixedStyle
						key={ id }
						{ ...{
							tagName,
							href,
							id,
							rel,
							media,
							textContent,
						} }
					/>
				)
			) }
			{ transformedStyles.map( ( css, index ) => (
				<style key={ index }>{ css }</style>
			) ) }
		</>
	);
}
