/**
 * External dependencies
 */
import { hasNamespace, useContextSystem } from '@wp-g2/context';
import { css, cx, getFontSize, ui } from '@wp-g2/styles';
import { isPlainObject, isNil } from 'lodash';

/**
 * WordPress dependencies
 */
import { useMemo, Children, cloneElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useTruncate } from '../truncate';
import { getOptimalTextShade } from '../utils';
import * as styles from './styles';
import { createHighlighterText } from './utils';

/**
 * @param {import('@wp-g2/create-styles').ViewOwnProps<import('./types').Props, 'span'>} props
 */
export default function useText( props ) {
	const {
		adjustLineHeightForInnerControls,
		align,
		children,
		className,
		color,
		ellipsizeMode,
		isDestructive = false,
		display,
		highlightEscape = false,
		highlightCaseSensitive = false,
		highlightWords,
		highlightSanitize,
		isBlock = false,
		letterSpacing,
		lineHeight: lineHeightProp,
		optimizeReadabilityFor,
		size,
		truncate = false,
		upperCase = false,
		variant,
		weight = ui.get( 'fontWeight' ),
		...otherProps
	} = useContextSystem( props, 'Text' );

	/** @type {import('react').ReactNode} */
	let content = children;
	const isHighlighter = Array.isArray( highlightWords );
	const isCaption = size === 'caption';

	if ( isHighlighter ) {
		if ( typeof children !== 'string' ) {
			throw new TypeError(
				'`children` of `Text` must only be `string` types when `highlightWords` is defined'
			);
		}

		content = createHighlighterText( {
			autoEscape: highlightEscape,
			// Disable reason: We need to disable this otherwise it erases the cast
			// eslint-disable-next-line object-shorthand
			children: /** @type {string} */ ( children ),
			caseSensitive: highlightCaseSensitive,
			searchWords: highlightWords,
			sanitize: highlightSanitize,
		} );
	}

	const classes = useMemo( () => {
		const sx = {};

		const lineHeight = getLineHeight( {
			lineHeight: lineHeightProp,
			adjustLineHeightForInnerControls,
		} );

		sx.Base = css( {
			color,
			display,
			fontSize: getFontSize( size ),
			/* eslint-disable jsdoc/valid-types */
			fontWeight: /** @type {import('react').CSSProperties['fontWeight']} */ ( weight ),
			/* eslint-enable jsdoc/valid-types */
			lineHeight,
			letterSpacing,
			textAlign: align,
		} );

		sx.upperCase = css( { textTransform: 'uppercase' } );

		sx.optimalTextColor = null;

		if ( optimizeReadabilityFor ) {
			const isOptimalTextColorDark =
				getOptimalTextShade( optimizeReadabilityFor ) === 'dark';

			sx.optimalTextColor = isOptimalTextColorDark
				? css( { color: ui.get( 'black' ) } )
				: css( { color: ui.get( 'white' ) } );
		}

		return cx(
			styles.Text,
			sx.Base,
			sx.optimalTextColor,
			isDestructive && styles.destructive,
			!! isHighlighter && styles.highlighterText,
			isBlock && styles.block,
			isCaption && styles.muted,
			variant && styles[ variant ],
			upperCase && sx.upperCase,
			className
		);
	}, [
		adjustLineHeightForInnerControls,
		align,
		className,
		color,
		display,
		isBlock,
		isCaption,
		isDestructive,
		isHighlighter,
		letterSpacing,
		lineHeightProp,
		optimizeReadabilityFor,
		size,
		upperCase,
		variant,
		weight,
	] );

	/** @type {undefined | 'auto' | 'none'} */
	let finalEllipsizeMode;
	if ( truncate === true ) {
		finalEllipsizeMode = 'auto';
	}
	if ( truncate === false ) {
		finalEllipsizeMode = 'none';
	}

	const finalComponentProps = {
		...otherProps,
		className: classes,
		children,
		ellipsizeMode: ellipsizeMode || finalEllipsizeMode,
	};

	const truncateProps = useTruncate( finalComponentProps );

	/**
	 * Enhance child `<Link />` components to inherit font size.
	 */
	if ( ! truncate && Array.isArray( children ) ) {
		content = Children.map( children, ( child ) => {
			// @ts-ignore
			if ( ! isPlainObject( child ) || ! ( 'props' in child ) ) {
				return child;
			}

			const isLink = hasNamespace( child, [ 'Link' ] );
			if ( isLink ) {
				return cloneElement( child, {
					size: child.props.size || 'inherit',
				} );
			}

			return child;
		} );
	}

	return {
		...truncateProps,
		children: truncate ? truncateProps.children : content,
	};
}

/* eslint-disable jsdoc/valid-types */
/**
 * @param {Object} props
 * @param {import('./types').Props['adjustLineHeightForInnerControls']} [props.adjustLineHeightForInnerControls]
 * @param {import('react').CSSProperties['lineHeight']} [props.lineHeight]
 */
/* eslint-enable jsdoc/valid-types */
function getLineHeight( { adjustLineHeightForInnerControls, lineHeight } ) {
	if ( ! isNil( lineHeight ) ) return lineHeight;

	if ( ! adjustLineHeightForInnerControls ) return;

	let value = `calc(${ ui.get( 'controlHeight' ) } + ${ ui.space( 2 ) })`;

	switch ( adjustLineHeightForInnerControls ) {
		case 'large':
			value = `calc(${ ui.get( 'controlHeightLarge' ) } + ${ ui.space(
				2
			) })`;
			break;
		case 'small':
			value = `calc(${ ui.get( 'controlHeightSmall' ) } + ${ ui.space(
				2
			) })`;
			break;
		case 'xSmall':
			value = `calc(${ ui.get( 'controlHeightXSmall' ) } + ${ ui.space(
				2
			) })`;
			break;
		default:
			break;
	}

	return value;
}
