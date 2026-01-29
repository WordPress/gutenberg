/**
 * External dependencies
 */
import type { SerializedStyles } from '@emotion/react';
import { css } from '@emotion/react';

/**
 * WordPress dependencies
 */
import { useMemo, Children, cloneElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../context';
import { hasConnectNamespace, useContextSystem } from '../context';
import { useTruncate } from '../truncate';
import { getOptimalTextShade } from '../utils/colors';
import * as styles from './styles';
import { createHighlighterText } from './utils';
import { getFontSize } from '../utils/font-size';
import { CONFIG, COLORS } from '../utils';
import { getLineHeight } from './get-line-height';
import { useCx } from '../utils/hooks/use-cx';
import type { Props } from './types';
import type React from 'react';

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

	const cx = useCx();

	const classes = useMemo( () => {
		const sx: Record< string, SerializedStyles | null > = {};

		const lineHeight = getLineHeight(
			adjustLineHeightForInnerControls,
			lineHeightProp
		);

		sx.Base = css( {
			color,
			display,
			fontSize: getFontSize( size ),
			fontWeight: weight,
			lineHeight,
			letterSpacing,
			textAlign: align,
		} );

		sx.upperCase = css( { textTransform: 'uppercase' } );

		sx.optimalTextColor = null;

		if ( optimizeReadabilityFor ) {
			const isOptimalTextColorDark =
				getOptimalTextShade( optimizeReadabilityFor ) === 'dark';

			// Should not use theme colors
			sx.optimalTextColor = isOptimalTextColorDark
				? css( { color: COLORS.gray[ 900 ] } )
				: css( { color: COLORS.white } );
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
		cx,
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
