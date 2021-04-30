/**
 * External dependencies
 */
import { css, cx } from 'emotion';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useContextSystem } from '../ui/context';
import * as styles from './styles';
import { TRUNCATE_ELLIPSIS, TRUNCATE_TYPE, truncateContent } from './utils';

/**
 * @param {import('../ui/context').ViewOwnProps<import('./types').Props, 'span'>} props
 */
export default function useTruncate( props ) {
	const {
		className,
		children,
		ellipsis = TRUNCATE_ELLIPSIS,
		ellipsizeMode = TRUNCATE_TYPE.auto,
		limit = 0,
		numberOfLines = 0,
		...otherProps
	} = useContextSystem( props, 'Truncate' );

	const truncatedContent = truncateContent(
		typeof children === 'string' ? /** @type {string} */ ( children ) : '',
		{
			ellipsis,
			ellipsizeMode,
			limit,
			numberOfLines,
		}
	);

	const shouldTruncate = ellipsizeMode === TRUNCATE_TYPE.auto;

	const classes = useMemo( () => {
		const sx = {};

		sx.numberOfLines = css`
			-webkit-box-orient: vertical;
			-webkit-line-clamp: ${ numberOfLines };
			display: -webkit-box;
			overflow: hidden;
		`;

		return cx(
			shouldTruncate && ! numberOfLines && styles.Truncate,
			shouldTruncate && !! numberOfLines && sx.numberOfLines,
			className
		);
	}, [ className, numberOfLines, shouldTruncate ] );

	return { ...otherProps, className: classes, children: truncatedContent };
}
