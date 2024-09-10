/**
 * External dependencies
 */
import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';
import a11yPlugin from 'colord/plugins/a11y';

/**
 * WordPress dependencies
 */
import { SVG } from '@wordpress/components';
import { useCallback, useMemo, memo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import transformStyles from '../../utils/transform-styles';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

extend( [ namesPlugin, a11yPlugin ] );

function useDarkThemeBodyClassName( styles, scope ) {
	return useCallback(
		( node ) => {
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
		[ styles, scope ]
	);
}

function EditorStyles( { styles, scope, transformOptions } ) {
	const overrides = useSelect(
		( select ) => unlock( select( blockEditorStore ) ).getStyleOverrides(),
		[]
	);
	const [ transformedStyles, transformedSvgs ] = useMemo( () => {
		const _styles = Object.values( styles ?? [] );

		for ( const [ id, override ] of overrides ) {
			const index = _styles.findIndex( ( { id: _id } ) => id === _id );
			const overrideWithId = { ...override, id };
			if ( index === -1 ) {
				_styles.push( overrideWithId );
			} else {
				_styles[ index ] = overrideWithId;
			}
		}

		return [
			transformStyles(
				_styles.filter( ( style ) => style?.css ),
				scope,
				transformOptions
			),
			_styles
				.filter( ( style ) => style.__unstableType === 'svgs' )
				.map( ( style ) => style.assets )
				.join( '' ),
		];
	}, [ styles, overrides, scope, transformOptions ] );

	return (
		<>
			{ /* Use an empty style element to have a document reference,
			     but this could be any element. */ }
			<style
				ref={ useDarkThemeBodyClassName( transformedStyles, scope ) }
			/>
			{ transformedStyles.map( ( css, index ) => (
				<style key={ index }>{ css }</style>
			) ) }
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
