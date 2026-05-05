/**
 * WordPress dependencies
 */
import type { ReactNode } from 'react';
import { Link, Stack, Text } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import styles from './style.module.css';

export type ListItem = {
	id: string;
	title: string;
	url: string;
	meta?: string[];
	icon?: ReactNode;
};

export default function List( {
	items,
	empty,
}: {
	items: ListItem[];
	empty?: ReactNode;
} ) {
	if ( items.length === 0 ) {
		return empty ?? null;
	}

	return (
		<Stack gap="md" direction="column">
			{ items.map( ( item ) => (
				<Stack
					key={ item.id }
					gap="md"
					direction="row"
					align="start"
					className={ styles.listItem }
				>
					{ item.icon && (
						<div className={ styles.listItemIcon }>
							{ item.icon }
						</div>
					) }
					<Stack
						direction="column"
						gap="xs"
						className={ styles.listItemContent }
					>
						<Text variant="body-md">
							{ item.url ? (
								<Link href={ item.url } openInNewTab>
									{ item.title }
								</Link>
							) : (
								item.title
							) }
						</Text>
						{ item.meta && item.meta.length > 0 && (
							<Stack
								direction="row"
								gap="xs"
								className={ styles.statusText }
							>
								{ item.meta.map( ( metaItem, index ) => (
									<Text
										key={ `${ item.id }-meta-${ index }` }
										variant="body-sm"
										className={ styles.statusText }
									>
										{ index > 0 && '· ' }
										{ metaItem }
									</Text>
								) ) }
							</Stack>
						) }
					</Stack>
				</Stack>
			) ) }
		</Stack>
	);
}
