import clsx from 'clsx';
import { Tooltip } from '@wordpress/ui';
import { Composite } from '../composite';
import { VisuallyHidden } from '../visually-hidden';
import { ALIGNMENT_LABEL } from './utils';
import type { AlignmentMatrixControlCellProps } from './types';
import type { WordPressComponentProps } from '../context';
import styles from './style.module.scss';

export default function Cell( {
	id,
	value,
	...props
}: WordPressComponentProps< AlignmentMatrixControlCellProps, 'span', false > ) {
	const label = ALIGNMENT_LABEL[ value ];

	return (
		<Tooltip.Root>
			<Tooltip.Trigger
				render={
					<Composite.Item
						id={ id }
						render={
							<span
								{ ...props }
								className={ clsx(
									styles.cell,
									props.className
								) }
								role="gridcell"
							/>
						}
					/>
				}
			>
				{ /* VoiceOver needs a text content to be rendered within grid cell,
			otherwise it'll announce the content as "blank". So we use a visually
			hidden element instead of aria-label. */ }
				<VisuallyHidden>{ label }</VisuallyHidden>
				<span className={ styles.point } role="presentation" />
			</Tooltip.Trigger>
			<Tooltip.Popup>{ label }</Tooltip.Popup>
		</Tooltip.Root>
	);
}
