/**
 * External dependencies
 */
import type { ComponentProps, ReactElement } from 'react';

/**
 * WordPress dependencies
 */
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import type { NormalizedField } from '../../types';
import { ItemClickWrapper } from '../utils/item-click-wrapper';

function ColumnPrimary< Item >( {
	item,
	level,
	titleField,
	mediaField,
	descriptionField,
	onClickItem,
	renderItemLink,
	isItemClickable,
}: {
	item: Item;
	level?: number;
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
		<Stack direction="row" gap="sm" align="flex-start" justify="flex-start">
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
								{ '—'.repeat( level ) }&nbsp;
							</span>
						) }
						<titleField.render item={ item } field={ titleField } />
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
