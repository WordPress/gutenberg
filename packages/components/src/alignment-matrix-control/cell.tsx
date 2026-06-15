/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * Internal dependencies
 */
import { Composite } from '../composite';
import Tooltip from '../tooltip';
import { VisuallyHidden } from '../visually-hidden';

/**
 * Internal dependencies
 */
import { ALIGNMENT_LABEL } from './utils';
import type { AlignmentMatrixControlCellProps } from './types';
import type { WordPressComponentProps } from '../context';
import styles from './style.module.scss';

export default function Cell( {
	id,
	value,
	...props
}: WordPressComponentProps< AlignmentMatrixControlCellProps, 'span', false > ) {
	return (
		<Tooltip text={ ALIGNMENT_LABEL[ value ] }>
			<Composite.Item
				id={ id }
				render={
					<span
						{ ...props }
						className={ clsx( styles.cell, props.className ) }
						role="gridcell"
					/>
				}
			>
				{ /* VoiceOver needs a text content to be rendered within grid cell,
			otherwise it'll announce the content as "blank". So we use a visually
			hidden element instead of aria-label. */ }
				<VisuallyHidden>{ value }</VisuallyHidden>
				<span className={ styles.point } role="presentation" />
			</Composite.Item>
		</Tooltip>
	);
}
