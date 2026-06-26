/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../context';
import { useContextSystem } from '../context';
import { TRUNCATE_ELLIPSIS, TRUNCATE_TYPE, truncateContent } from './utils';
import type { TruncateProps } from './types';
import styles from './style.module.scss';

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
		style,
		...otherProps
	} = useContextSystem( props, 'Truncate' );

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
	const shouldClampLines = shouldTruncate && !! numberOfLines;
	const shouldClampSingleLine = shouldClampLines && numberOfLines === 1;

	const classes = clsx(
		shouldTruncate && ! numberOfLines && styles.truncate,
		shouldClampLines && styles[ 'is-line-clamp' ],
		shouldClampSingleLine && styles[ 'is-single-line' ],
		className
	);

	const truncateStyle = shouldClampLines
		? {
				...style,
				'--wp-components-truncate-lines': numberOfLines,
		  }
		: style;

	return {
		...otherProps,
		className: classes,
		style: truncateStyle,
		children: truncatedContent,
	};
}
