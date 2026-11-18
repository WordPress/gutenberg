import type { ComponentProps, ReactElement } from 'react';
import { useRegistry } from '@wordpress/data';
import { Stack } from '@wordpress/ui';
import type { Action, MediaAspectRatio, NormalizedField } from '../../../types';
import { PrimaryActions } from '../../dataviews-item-actions';
import { ItemClickWrapper } from '../utils/item-click-wrapper';
import { usePrimaryActionsFit } from './use-primary-actions-fit';

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
	primaryActions,
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
	primaryActions?: Action< Item >[];
} ) {
	const registry = useRegistry();
	const { titleRowRef, primaryActionsRef } = usePrimaryActionsFit();
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
					<div
						ref={ titleRowRef }
						className="dataviews-view-table__title-row"
					>
						<ItemClickWrapper
							item={ item }
							isItemClickable={ isItemClickable }
							onClickItem={ onClickItem }
							renderItemLink={ renderItemLink }
							className="dataviews-view-table__cell-content-wrapper dataviews-title-field"
						>
							{ level !== undefined && level > 0 && (
								<span className="dataviews-view-table__level">
									{ Array( level ).fill( '—' ).join( ' ' ) }
									&nbsp;
								</span>
							) }
							<titleField.render
								item={ item }
								field={ titleField }
							/>
						</ItemClickWrapper>
						{ !! primaryActions?.length && (
							// Stop clicks from reaching the row, which toggles
							// its selection.
							// eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
							<div
								className="dataviews-view-table__primary-actions"
								onClick={ ( event ) => event.stopPropagation() }
							>
								<div
									ref={ primaryActionsRef }
									className="dataviews-view-table__primary-actions-content"
								>
									<PrimaryActions
										item={ item }
										actions={ primaryActions }
										registry={ registry }
										buttonVariant="link"
									/>
								</div>
							</div>
						) }
					</div>
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
