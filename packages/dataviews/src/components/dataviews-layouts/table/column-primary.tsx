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
import type { MediaAspectRatio, NormalizedField } from '../../../types';
import { ItemClickWrapper } from '../utils/item-click-wrapper';

function ColumnPrimary< Item >( {
	item,
	level,
	titleField,
	mediaField,
	mediaAspectRatio,
	descriptionField,
	onClickItem,
	renderItemLink,
	isItemClickable,
}: {
	item: Item;
	level?: number;
	titleField?: NormalizedField< Item >;
	mediaField?: NormalizedField< Item >;
	mediaAspectRatio?: MediaAspectRatio;
	descriptionField?: NormalizedField< Item >;
	onClickItem?: ( item: Item ) => void;
	renderItemLink?: (
		props: {
			item: Item;
		} & ComponentProps< 'a' >
	) => ReactElement;
	isItemClickable: ( item: Item ) => boolean;
} ) {
	// Srcset/size hint for the media render. The preview box is 32px square
	// by default; when the view configures `layout.aspectRatio`, the box
	// keeps the 32px height while the ratio derives its width, clamped by
	// the stylesheet's 60px `max-width`, so widen the hint to match the
	// rendered size and avoid picking an undersized (blurry) source.
	let mediaSizes = '32px';
	if ( mediaAspectRatio ) {
		const [ ratioWidth, ratioHeight ] = mediaAspectRatio
			.split( '/' )
			.map( Number );
		mediaSizes = `${ Math.min(
			60,
			Math.round( ( 32 * ratioWidth ) / ratioHeight )
		) }px`;
	}
	return (
		<Stack direction="row" gap="md" align="flex-start" justify="flex-start">
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
						config={ { sizes: mediaSizes } }
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
