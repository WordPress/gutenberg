import clsx from 'clsx';
import type React from 'react';
import { useMemo, Children, cloneElement } from '@wordpress/element';
import type { WordPressComponentProps } from '../context';
import { hasConnectNamespace, useContextSystem } from '../context';
import { useTruncate } from '../truncate';
import { getOptimalTextShade } from '../utils/colors';
import styles from './style.module.scss';
import { createHighlighterText } from './utils';
import { getFontSize } from '../utils/font-size';
import { CONFIG } from '../utils';
import { getLineHeight } from './get-line-height';
import type { Props } from './types';

const CSS_WIDE_KEYWORDS = new Set( [
	'inherit',
	'initial',
	'unset',
	'revert',
	'revert-layer',
] );

/**
 * @param {import('../context').WordPressComponentProps<import('./types').Props, 'span'>} props
 */
export default function useText(
	props: WordPressComponentProps< Props, 'span' >
) {
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
		style,
		truncate = false,
		upperCase = false,
		variant,
		weight = CONFIG.fontWeight,
		...otherProps
	} = useContextSystem( props, 'Text' );

	let content: React.ReactNode = children;
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
			children,
			caseSensitive: highlightCaseSensitive,
			searchWords: highlightWords,
			sanitize: highlightSanitize,
		} );
	}

	const optimalTextShade = useMemo(
		() =>
			optimizeReadabilityFor &&
			getOptimalTextShade( optimizeReadabilityFor ),
		[ optimizeReadabilityFor ]
	);
	const typography = {
		color,
		display,
		'font-size': getFontSize( size ),
		'font-weight': weight,
		'line-height': getLineHeight(
			adjustLineHeightForInnerControls,
			lineHeightProp
		),
		'letter-spacing':
			typeof letterSpacing === 'number'
				? `${ letterSpacing }px`
				: letterSpacing,
		'text-align': align,
	};
	const textStyle: React.CSSProperties & {
		[ key: `--wp-components-text-${ string }` ]:
			| string
			| number
			| undefined;
	} = {};
	const keywordClasses: string[] = [];

	for ( const [ property, value ] of Object.entries( typography ) ) {
		const keyword =
			typeof value === 'string' ? value.trim().toLowerCase() : undefined;
		if ( keyword && CSS_WIDE_KEYWORDS.has( keyword ) ) {
			// CSS-wide keywords must apply to the declaration, not its custom property.
			keywordClasses.push( styles[ `${ property }-${ keyword }` ] );
		} else {
			textStyle[ `--wp-components-text-${ property }` ] =
				value === '' ? undefined : value;
		}
	}

	const classes = clsx(
		styles.text,
		{
			[ styles[ 'has-display' ] ]: !! display,
			[ styles[ 'has-letter-spacing' ] ]:
				letterSpacing !== undefined && letterSpacing !== '',
			[ styles[ 'has-text-align' ] ]: !! align,
		},
		keywordClasses,
		{
			[ styles[ 'readability-dark' ] ]: optimalTextShade === 'dark',
			[ styles[ 'readability-light' ] ]:
				!! optimalTextShade && optimalTextShade !== 'dark',
			[ styles.destructive ]: isDestructive,
			[ styles[ 'highlighter-text' ] ]: isHighlighter,
			[ styles.block ]: isBlock,
			[ styles.muted ]: isCaption || variant === 'muted',
			[ styles[ 'upper-case' ] ]: upperCase,
		},
		className
	);

	let finalEllipsizeMode: undefined | 'auto' | 'none';
	if ( truncate === true ) {
		finalEllipsizeMode = 'auto';
	}
	if ( truncate === false ) {
		finalEllipsizeMode = 'none';
	}

	const finalComponentProps = {
		...otherProps,
		className: classes,
		style: { ...textStyle, ...style },
		children,
		ellipsizeMode: ellipsizeMode || finalEllipsizeMode,
	};

	const truncateProps = useTruncate( finalComponentProps );

	/**
	 * Enhance child `<Link />` components to inherit font size.
	 */
	if ( ! truncate && Array.isArray( children ) ) {
		content = Children.map( children, ( child ) => {
			if (
				typeof child !== 'object' ||
				child === null ||
				! ( 'props' in child )
			) {
				return child;
			}

			const isLink = hasConnectNamespace( child, [ 'Link' ] );
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
