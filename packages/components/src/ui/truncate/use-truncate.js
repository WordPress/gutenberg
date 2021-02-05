/**
 * External dependencies
 */
import { useContextSystem } from '@wp-g2/context';
import { css, cx } from '@wp-g2/styles';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import * as styles from './styles';
import { TRUNCATE_ELLIPSIS, TRUNCATE_TYPE, truncateContent } from './utils';

/**
 * @typedef Props
 * @property {string} [ellipsis='...'] String to use to truncate the string with.
 * @property {'auto' | 'head' | 'tail' | 'middle' | 'none'} [ellipsizeMode='auto'] Mode to follow.
 * @property {number} [limit=0] Limit.
 * @property {number} [numberOfLines=0] Number of lines.
 */

/**
 * @param {import('@wp-g2/create-styles').ViewOwnProps<Props, 'span'>} props
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
