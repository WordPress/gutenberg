import {
	trash,
	drafts,
	published,
	scheduled,
	pending,
	notAllowed,
} from '@wordpress/icons';
import { Icon, Stack } from '@wordpress/ui';
import type { PostWithStatus } from './types';
import styles from './style.module.css';

const ICONS: Record< string, typeof drafts > = {
	draft: drafts,
	future: scheduled,
	pending,
	private: notAllowed,
	publish: published,
	trash,
};

/*
 * A copy of the status view of `@wordpress/fields`, laid out with `Stack` and
 * `Icon` from `@wordpress/ui`. The labels come from the elements of the
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
	const icon = ICONS[ currentStatus ];
	return (
		<Stack direction="row" align="center" justify="flex-start">
			{ icon && (
				<div className={ styles.icon }>
					<Icon icon={ icon } />
				</div>
			) }
			<span>{ label }</span>
		</Stack>
	);
}
