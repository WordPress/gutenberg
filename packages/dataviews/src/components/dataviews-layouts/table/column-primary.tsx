/**
 * External dependencies
 */
import type { ComponentProps, ReactElement } from 'react';

/**
 * WordPress dependencies
 */
import { _n, sprintf } from '@wordpress/i18n';
import { Stack, Badge } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import type { NormalizedField } from '../../../types';
import { ItemClickWrapper } from '../utils/item-click-wrapper';

function ColumnPrimary< Item >( {
	item,
	level,
	childCount,
	showHierarchyBadge,
	titleField,
	mediaField,
	descriptionField,
	onClickItem,
	renderItemLink,
	isItemClickable,
}: {
	item: Item;
	level?: number;
	childCount?: number;
	showHierarchyBadge?: boolean;
	titleField?: NormalizedField< Item >;
	mediaField?: NormalizedField< Item >;
	descriptionField?: NormalizedField< Item >;
	onClickItem?: ( item: Item ) => void;
	renderItemLink?: (
		props: {
			item: Item;
		} & ComponentProps< 'a' >
	) => ReactElement;
	isItemClickable: ( item: Item ) => boolean;
} ) {
	return (
		<Stack
			direction="row"
			gap="md"
			align="flex-start"
			justify="flex-start"
			className="dataviews-view-table__primary-column"
		>
			{ mediaField && (
				<ItemClickWrapper
					item={ item }
					isItemClickable={ isItemClickable }
					onClickItem={ onClickItem }
					renderItemLink={ renderItemLink }
					className="dataviews-view-table__cell-content-wrapper dataviews-column-primary__media"
					aria-label={
						isItemClickable( item ) &&
						( !! onClickItem || !! renderItemLink ) &&
						!! titleField
							? titleField.getValue?.( { item } )
							: undefined
					}
				>
					<mediaField.render
						item={ item }
						field={ mediaField }
						config={ { sizes: '32px' } }
					/>
				</ItemClickWrapper>
			) }
			<Stack
				direction="column"
				align="flex-start"
				className="dataviews-view-table__primary-column-content"
			>
				{ titleField && (
					<ItemClickWrapper
						item={ item }
						isItemClickable={ isItemClickable }
						onClickItem={ onClickItem }
						renderItemLink={ renderItemLink }
						className="dataviews-view-table__cell-content-wrapper dataviews-title-field"
					>
						{ level !== undefined && level > 0 && (
							<span className="dataviews-view-table__level">
								{ Array( level ).fill( '—' ).join( ' ' ) }&nbsp;
							</span>
						) }
						<titleField.render item={ item } field={ titleField } />
						{ showHierarchyBadge && !! childCount && (
							<Badge
								intent="none"
								className="dataviews-view-table__hierarchy-badge"
								aria-label={ sprintf(
									// translators: %d: Number of direct child items.
									_n( '%d child', '%d children', childCount ),
									childCount
								) }
							>
								{ childCount.toString() }
							</Badge>
						) }
					</ItemClickWrapper>
				) }
				{ descriptionField && (
					<descriptionField.render
						item={ item }
						field={ descriptionField }
					/>
				) }
			</Stack>
		</Stack>
	);
}

export default ColumnPrimary;
