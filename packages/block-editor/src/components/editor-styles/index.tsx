import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';
import a11yPlugin from 'colord/plugins/a11y';
import { SVG } from '@wordpress/components';
import { useCallback, useMemo, memo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import transformStyles from '../../utils/transform-styles';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import type { EditorStyle } from '../../utils/transform-styles/types';
import type { StyleOverride } from '../../store/types';
import type { EditorStylesProps, EditorStylesStyle } from './types';

extend( [ namesPlugin, a11yPlugin ] );

function useDarkThemeBodyClassName( styles: unknown[], scope?: string ) {
	return useCallback(
		( node: HTMLElement | null ) => {
			if ( ! node ) {
				return;
			}

			const { ownerDocument } = node;
			const { defaultView, body } = ownerDocument;
			const canvas = scope ? ownerDocument.querySelector( scope ) : body;

			let backgroundColor;

			if ( ! canvas ) {
				// The real .editor-styles-wrapper element might not exist in the
				// DOM, so calculate the background color by creating a fake
				// wrapper.
				const tempCanvas = ownerDocument.createElement( 'div' );
				tempCanvas.classList.add( 'editor-styles-wrapper' );
				body.appendChild( tempCanvas );

				backgroundColor = defaultView
					?.getComputedStyle( tempCanvas, null )
					.getPropertyValue( 'background-color' );

				body.removeChild( tempCanvas );
			} else {
				backgroundColor = defaultView
					?.getComputedStyle( canvas, null )
					.getPropertyValue( 'background-color' );
			}
			// `colord` reads a missing color as an invalid one.
			const colordBackgroundColor = colord( backgroundColor as string );
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
		[ styles, scope ]
	);
}

function EditorStyles( {
	styles,
	scope,
	transformOptions,
}: EditorStylesProps ) {
	const overrides = useSelect(
		( select ) => unlock( select( blockEditorStore ) ).getStyleOverrides(),
		[]
	);
	const [ transformedStyles, transformedSvgs ] = useMemo( () => {
		const _styles: EditorStylesStyle[] = Object.values( styles ?? [] );

		/*
		 * Custom CSS overrides are applied after all other overrides so they
		 * win the cascade at equal specificity, mirroring the front end where
		 * the custom CSS stylesheet is printed last. Both partitions keep the
		 * block order established by getStyleOverrides.
		 */
		const orderedOverrides = [
			...overrides.filter(
				( [ , override ]: [ string, StyleOverride ] ) =>
					override?.__unstableType !== 'custom-css'
			),
			...overrides.filter(
				( [ , override ]: [ string, StyleOverride ] ) =>
					override?.__unstableType === 'custom-css'
			),
		];

		for ( const [ id, override ] of orderedOverrides ) {
			const index = _styles.findIndex( ( { id: _id } ) => id === _id );
			// Overrides carry the fields of a style.
			const overrideWithId = { ...override, id } as EditorStylesStyle;
			if ( index === -1 ) {
				_styles.push( overrideWithId );
			} else {
				_styles[ index ] = overrideWithId;
			}
		}

		// The filter keeps the styles with CSS.
		const stylesWithCSS = _styles.filter(
			( style ) => style?.css
		) as EditorStyle[];
		// Without a scope, the CSS is inserted as it is, but for its URLs,
		// which a linked file resolves relative to itself. The link takes
		// the place of the CSS, so the order of the styles is kept.
		const isLinked = ( style: EditorStyle ) => ! scope && !! style.href;
		const transformed = transformStyles(
			stylesWithCSS.filter( ( style ) => ! isLinked( style ) ),
			scope,
			transformOptions
		);
		let transformedIndex = 0;

		return [
			stylesWithCSS.map( ( style ) =>
				isLinked( style )
					? { href: style.href as string }
					: transformed[ transformedIndex++ ]
			),
			_styles
				.filter( ( style ) => style.__unstableType === 'svgs' )
				.map( ( style ) => style.assets )
				.join( '' ),
		];
	}, [ styles, overrides, scope, transformOptions ] );
	const updateDarkThemeBodyClassName = useDarkThemeBodyClassName(
		transformedStyles,
		scope
	);

	return (
		<>
			{ /* Use an empty style element to have a document reference,
			     but this could be any element. */ }
			<style ref={ updateDarkThemeBodyClassName } />
			{ transformedStyles.map( ( style, index ) =>
				typeof style === 'object' && style !== null ? (
					<link
						key={ index }
						rel="stylesheet"
						href={ style.href }
						// The linked styles may change the background color.
						onLoad={ ( event ) =>
							updateDarkThemeBodyClassName( event.currentTarget )
						}
					/>
				) : (
					<style key={ index }>{ style }</style>
				)
			) }
			<SVG
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 0 0"
				width="0"
				height="0"
				role="none"
				style={ {
					visibility: 'hidden',
					position: 'absolute',
					left: '-9999px',
					overflow: 'hidden',
				} }
				dangerouslySetInnerHTML={ { __html: transformedSvgs } }
			/>
		</>
	);
}

export default memo( EditorStyles );
