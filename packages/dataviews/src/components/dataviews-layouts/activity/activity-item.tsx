/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { VisuallyHidden } from '@wordpress/components';
import { useRef, useContext, useMemo } from '@wordpress/element';
import { useRegistry } from '@wordpress/data';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import ItemActions, { PrimaryActions } from '../../dataviews-item-actions';
import DataViewsContext from '../../dataviews-context';
import { ItemClickWrapper } from '../utils/item-click-wrapper';
import type { NormalizedField, ViewActivityProps } from '../../../types';

function ActivityItem< Item >(
	props: ViewActivityProps< Item > & {
		item: Item;
		mediaField?: NormalizedField< Item >;
		titleField?: NormalizedField< Item >;
		descriptionField?: NormalizedField< Item >;
		otherFields: NormalizedField< Item >[];
		posinset?: number;
	}
) {
	const {
		view,
		actions,
		item,
		titleField,
		mediaField,
		descriptionField,
		otherFields,
		posinset,
		onClickItem,
		renderItemLink,
		isItemClickable,
	} = props;
	const {
		showTitle = true,
		showMedia = true,
		showDescription = true,
		infiniteScrollEnabled,
	} = view;
	const itemRef = useRef< HTMLDivElement >( null );
	const registry = useRegistry();
	const { paginationInfo } = useContext( DataViewsContext );

	const { primaryActions, eligibleActions } = useMemo( () => {
		// If an action is eligible for all items, doesn't need
		// to provide the `isEligible` function.
		const _eligibleActions = actions.filter(
			( action ) => ! action.isEligible || action.isEligible( item )
		);
		const _primaryActions = _eligibleActions.filter(
			( action ) => action.isPrimary
		);
		return {
			primaryActions: _primaryActions,
			eligibleActions: _eligibleActions,
		};
	}, [ actions, item ] );

	const density = view.layout?.density ?? 'balanced';
	const mediaContent =
		showMedia && density !== 'compact' && mediaField?.render ? (
			<mediaField.render
				item={ item }
				field={ mediaField }
				config={ {
					sizes: density === 'comfortable' ? '32px' : '24px',
				} }
			/>
		) : null;

	const renderedMediaField = (
		<div className="dataviews-view-activity__item-type-icon">
			{ mediaContent || (
				<span
					className="dataviews-view-activity__item-bullet"
					aria-hidden="true"
				/>
			) }
		</div>
	);

	const renderedTitleField =
		showTitle && titleField?.render ? (
			<titleField.render item={ item } field={ titleField } />
		) : null;

	const verticalGap = useMemo( () => {
		switch ( density ) {
			case 'comfortable':
				return 'sm';
			default:
				return 'xs';
		}
	}, [ density ] );

	return (
		<div
			ref={ itemRef }
			role={ infiniteScrollEnabled ? 'article' : undefined }
			aria-posinset={ posinset }
			aria-setsize={
				infiniteScrollEnabled ? paginationInfo.totalItems : undefined
			}
			className={ clsx(
				'dataviews-view-activity__item',
				density === 'compact' && 'is-compact',
				density === 'balanced' && 'is-balanced',
				density === 'comfortable' && 'is-comfortable'
			) }
		>
			<Stack direction="row" gap="md" justify="start" align="flex-start">
				<Stack
					direction="column"
					gap="2xs"
					align="center"
					className="dataviews-view-activity__item-type"
				>
					{ renderedMediaField }
				</Stack>
				<Stack
					direction="column"
					gap={ verticalGap }
					align="flex-start"
					className="dataviews-view-activity__item-content"
				>
					{ renderedTitleField && (
						<ItemClickWrapper
							item={ item }
							isItemClickable={ isItemClickable }
							onClickItem={ onClickItem }
							renderItemLink={ renderItemLink }
							className="dataviews-view-activity__item-title"
						>
							{ renderedTitleField }
						</ItemClickWrapper>
					) }
					{ showDescription && descriptionField && (
						<div className="dataviews-view-activity__item-description">
							<descriptionField.render
								item={ item }
								field={ descriptionField }
							/>
						</div>
					) }
					<div className="dataviews-view-activity__item-fields">
						{ otherFields.map( ( field ) => (
							<div
								key={ field.id }
								className="dataviews-view-activity__item-field"
							>
								<VisuallyHidden
									as="span"
									className="dataviews-view-activity__item-field-label"
								>
									{ field.label }
								</VisuallyHidden>
								<span className="dataviews-view-activity__item-field-value">
									<field.render
										item={ item }
										field={ field }
									/>
								</span>
							</div>
						) ) }
					</div>
					{ !! primaryActions?.length && (
						<PrimaryActions
							item={ item }
							actions={ primaryActions }
							registry={ registry }
							buttonVariant="secondary"
						/>
					) }
				</Stack>
				{ primaryActions.length < eligibleActions.length && (
					<div className="dataviews-view-activity__item-actions">
						<ItemActions
							item={ item }
							actions={ eligibleActions }
							isCompact
						/>
					</div>
				) }
			</Stack>
		</div>
	);
}

export default ActivityItem;
