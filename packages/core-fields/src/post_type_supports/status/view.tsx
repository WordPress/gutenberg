import { Icon, Stack } from '@wordpress/ui';
import type { PostWithStatus } from './types';
import { STATUS_ICONS } from './icons';
import styles from './style.module.css';

/*
 * The status of a post, laid out with `Stack` and `Icon` from `@wordpress/ui`. The labels come from the elements of the
 * field, declared on the server; the icons, which cannot be serialized, from
 * this module.
 */
export default function StatusView( {
	item,
	field,
}: {
	item: PostWithStatus;
	field: {
		getValue: ( args: { item: PostWithStatus } ) => string;
		elements?: { value: unknown; label: string }[];
	};
} ) {
	const currentStatus = field.getValue( { item } );
	const status = field.elements?.find(
		( { value } ) => value === currentStatus
	);
	const label = status?.label || currentStatus;
	const icon = STATUS_ICONS[ currentStatus ];
	return (
		<Stack direction="row" gap="xs" align="flex-start" justify="flex-start">
			{ icon && (
				<div className={ styles.icon }>
					<Icon icon={ icon } />
				</div>
			) }
			<span>{ label }</span>
		</Stack>
	);
}
