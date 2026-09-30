import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { Text } from '../text';
import type { EmptyStateTitleProps } from './types';
import styles from './style.module.css';

const DEFAULT_TAG = <h2 />;

/**
 * The title is a short heading that communicates the empty state.
 */
export const Title = forwardRef< HTMLHeadingElement, EmptyStateTitleProps >(
	function EmptyStateTitle(
		{ render = DEFAULT_TAG, className, children, ...props },
		ref
	) {
		return (
			<Text
				ref={ ref }
				variant="heading-lg"
				render={ render }
				className={ clsx( styles.title, className ) }
				{ ...props }
			>
				{ children }
			</Text>
		);
	}
);
