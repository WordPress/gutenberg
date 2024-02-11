/**
 * External dependencies
 */
import { css } from '@emotion/react';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../context';
import { useContextSystem } from '../context';
import * as styles from './styles';
import { TRUNCATE_ELLIPSIS, TRUNCATE_TYPE, truncateContent } from './utils';
import { useCx } from '../utils/hooks/use-cx';
import type { TruncateProps } from './types';

export default function useTruncate(
	props: WordPressComponentProps< TruncateProps, 'span' >
) {
	const {
		className,
		children,
		ellipsis = TRUNCATE_ELLIPSIS,
		ellipsizeMode = TRUNCATE_TYPE.auto,
		limit = 0,
		numberOfLines = 0,
		...otherProps
	} = useContextSystem( props, 'Truncate' );

	const cx = useCx();

	let childrenAsText;
	if ( typeof children === 'string' ) {
		childrenAsText = children;
	} else if ( typeof children === 'number' ) {
		childrenAsText = children.toString();
	}

	const truncatedContent = childrenAsText
		? truncateContent( childrenAsText, {
				ellipsis,
				ellipsizeMode,
				limit,
				numberOfLines,
		  } )
		: children;

	const shouldTruncate =
		!! childrenAsText && ellipsizeMode === TRUNCATE_TYPE.auto;

	const classes = useMemo( () => {
		const truncateLines = css`
			-webkit-box-orient: vertical;
			-webkit-line-clamp: ${ numberOfLines };
			display: -webkit-box;
			overflow: hidden;
		`;

		return cx(
			shouldTruncate && ! numberOfLines && styles.Truncate,
			shouldTruncate && !! numberOfLines && truncateLines,
			className
		);
	}, [ className, cx, numberOfLines, shouldTruncate ] );

	return { ...otherProps, className: classes, children: truncatedContent };
}
