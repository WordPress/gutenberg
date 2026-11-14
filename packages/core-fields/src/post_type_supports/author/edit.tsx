import clsx from 'clsx';
import { useSelect } from '@wordpress/data';
import { store as coreDataStore } from '@wordpress/core-data';
import type { DataFormControlProps } from '@wordpress/dataviews';
import { useMemo } from '@wordpress/element';
import { commentAuthorAvatar as authorIcon } from '@wordpress/icons';
import { Icon, SelectControl, Stack } from '@wordpress/ui';
import { AUTHORS_QUERY, type Author } from './authors-query';
import type { PostWithAuthor } from './types';
import styles from '../../shared/author/style.module.css';

type AuthorItem = {
	value: string;
	label: string;
	avatar?: string;
};

function AuthorLabel( { item }: { item: AuthorItem } ) {
	return (
		<Stack direction="row" align="center">
			{ item.avatar ? (
				<div className={ clsx( styles.avatar, styles[ 'is-loaded' ] ) }>
					<img alt="" src={ item.avatar } />
				</div>
			) : (
				<div className={ styles.icon }>
					<Icon icon={ authorIcon } />
				</div>
			) }
			<span className={ styles.name }>{ item.label }</span>
		</Stack>
	);
}

/*
 * The author control, built with `SelectControl` from `@wordpress/ui` to show
 * each author's avatar next to their name.
 */
export default function AuthorEdit( {
	data,
	field,
	onChange,
	hideLabelFromVision,
}: DataFormControlProps< PostWithAuthor > ) {
	const authors = useSelect(
		( select ) =>
			select( coreDataStore ).getEntityRecords< Author >(
				'root',
				'user',
				AUTHORS_QUERY
			),
		[]
	);
	const value = field.getValue( { item: data } );
	const items = useMemo( () => {
		const authorItems: AuthorItem[] = ( authors ?? [] ).map(
			( author ) => ( {
				value: String( author.id ),
				label: author.name,
				avatar: author.avatar_urls?.[ 48 ],
			} )
		);
		// The current author may not be listed yet, or at all, so fall back
		// on the author embedded in the record.
		const embeddedAuthor = data?._embedded?.author?.[ 0 ];
		if (
			embeddedAuthor &&
			embeddedAuthor.id === value &&
			! authorItems.some( ( item ) => item.value === String( value ) )
		) {
			authorItems.unshift( {
				value: String( embeddedAuthor.id ),
				label: embeddedAuthor.name,
				avatar: embeddedAuthor.avatar_urls?.[ 48 ],
			} );
		}
		return authorItems;
	}, [ authors, data, value ] );
	const selectedItem =
		items.find( ( item ) => item.value === String( value ) ) ?? null;

	return (
		<SelectControl
			label={ field.label }
			hideLabelFromVision={ hideLabelFromVision }
			items={ items }
			value={ selectedItem }
			onValueChange={ ( item ) => {
				if ( item?.value ) {
					onChange(
						field.setValue( { item: data, value: item.value } )
					);
				}
			} }
			disabled={ field.isDisabled( { item: data, field } ) }
			// Without a value (a bulk edit), the default trigger shows the
			// placeholder.
			trigger={
				selectedItem ? (
					<SelectControl.Trigger>
						<AuthorLabel item={ selectedItem } />
					</SelectControl.Trigger>
				) : undefined
			}
		>
			{ items.map( ( item ) => (
				<SelectControl.Item
					key={ item.value }
					value={ item }
					label={ item.label }
				>
					<SelectControl.ItemLabel>
						<AuthorLabel item={ item } />
					</SelectControl.ItemLabel>
				</SelectControl.Item>
			) ) }
		</SelectControl>
	);
}
