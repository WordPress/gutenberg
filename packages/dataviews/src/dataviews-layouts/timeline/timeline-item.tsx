/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	Button,
	privateApis as componentsPrivateApis,
	VisuallyHidden,
} from '@wordpress/components';
import { useRef, useState, useContext, useMemo } from '@wordpress/element';
import { moreVertical } from '@wordpress/icons';
import { useRegistry } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import {
	ActionsMenuGroup,
	ActionModal,
} from '../../components/dataviews-item-actions';
import DataViewsContext from '../../components/dataviews-context';
import { ItemClickWrapper } from '../utils/item-click-wrapper';
import type {
	NormalizedField,
	ActionModal as ActionModalType,
	ViewTimelineProps,
} from '../../types';

const { Menu } = unlock( componentsPrivateApis );

function TimelineItem< Item >(
	props: ViewTimelineProps< Item > & {
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
	const [ activeModalAction, setActiveModalAction ] = useState(
		null as ActionModalType< Item > | null
	);

	const { primaryAction, eligibleActions } = useMemo( () => {
		// If an action is eligible for all items, doesn't need
		// to provide the `isEligible` function.
		const _eligibleActions = actions.filter(
			( action ) => ! action.isEligible || action.isEligible( item )
		);
		const _primaryActions = _eligibleActions.filter(
			( action ) => action.isPrimary
		);
		return {
			primaryAction: _primaryActions[ 0 ],
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
		<div className="dataviews-view-timeline__event-type-icon">
			{ mediaContent || (
				<span
					className="dataviews-view-timeline__event-bullet"
					aria-hidden="true"
				/>
			) }
		</div>
	);

	const renderedTitleField =
		showTitle && titleField?.render ? (
			<titleField.render item={ item } field={ titleField } />
		) : null;

	// Primary action buttons (rendered below content)
	const renderedPrimaryActions = primaryAction && (
		<HStack
			spacing={ 2 }
			className="dataviews-view-timeline__primary-actions"
		>
			{ 'RenderModal' in primaryAction ? (
				<Button
					disabled={ !! primaryAction.disabled }
					accessibleWhenDisabled
					size="compact"
					variant="secondary"
					onClick={ () => setIsModalOpen( true ) }
				>
					{ typeof primaryAction.label === 'string'
						? primaryAction.label
						: primaryAction.label( [ item ] ) }
				</Button>
			) : (
				<Button
					disabled={ !! primaryAction.disabled }
					accessibleWhenDisabled
					size="compact"
					variant="secondary"
					onClick={ () => {
						primaryAction.callback( [ item ], {
							registry,
						} );
					} }
				>
					{ typeof primaryAction.label === 'string'
						? primaryAction.label
						: primaryAction.label( [ item ] ) }
				</Button>
			) }
		</HStack>
	);

	// Dropdown menu (rendered to right of title) - includes all actions
	const renderedDropdownMenu = eligibleActions?.length > 0 && (
		<div className="dataviews-view-timeline__dropdown-cell">
			<Menu placement="bottom-end">
				<Menu.TriggerButton
					render={
						<Button
							size="compact"
							icon={ moreVertical }
							label={ __( 'Actions' ) }
							accessibleWhenDisabled
							disabled={ ! eligibleActions.length }
						/>
					}
				/>
				<Menu.Popover>
					<ActionsMenuGroup
						actions={ eligibleActions }
						item={ item }
						registry={ registry }
						setActiveModalAction={ setActiveModalAction }
					/>
				</Menu.Popover>
			</Menu>
		</div>
	);

	const [ isModalOpen, setIsModalOpen ] = useState( false );

	return (
		<>
			<div
				ref={ itemRef }
				role={ infiniteScrollEnabled ? 'article' : undefined }
				aria-posinset={ posinset }
				aria-setsize={
					infiniteScrollEnabled
						? paginationInfo.totalItems
						: undefined
				}
				className="dataviews-view-timeline__item"
			>
				<HStack
					spacing={ 3 }
					justify="start"
					alignment="flex-start"
					className="dataviews-view-timeline__row"
				>
					<div
						className={ clsx(
							'dataviews-view-timeline__event-type',
							density === 'compact' && 'is-compact',
							density === 'comfortable' && 'is-comfortable'
						) }
					>
						{ renderedMediaField }
					</div>
					<VStack
						spacing={ 0 }
						alignment="flex-start"
						className="dataviews-view-timeline__event-content"
					>
						<ItemClickWrapper
							item={ item }
							isItemClickable={ isItemClickable }
							onClickItem={ onClickItem }
							renderItemLink={ renderItemLink }
							className="dataviews-view-timeline__event-title"
						>
							{ renderedTitleField }
						</ItemClickWrapper>
						{ showDescription && descriptionField && (
							<div className="dataviews-view-timeline__event-description">
								<descriptionField.render
									item={ item }
									field={ descriptionField }
								/>
							</div>
						) }
						<div className="dataviews-view-timeline__fields">
							{ otherFields.map( ( field ) => (
								<div
									key={ field.id }
									className="dataviews-view-timeline__field"
								>
									<VisuallyHidden
										as="span"
										className="dataviews-view-timeline__field-label"
									>
										{ field.label }
									</VisuallyHidden>
									<span className="dataviews-view-timeline__field-value">
										<field.render
											item={ item }
											field={ field }
										/>
									</span>
								</div>
							) ) }
						</div>
						{ renderedPrimaryActions }
					</VStack>
					{ renderedDropdownMenu }
				</HStack>
			</div>
			{ isModalOpen &&
				primaryAction &&
				'RenderModal' in primaryAction && (
					<ActionModal
						action={ primaryAction }
						items={ [ item ] }
						closeModal={ () => setIsModalOpen( false ) }
					/>
				) }
			{ !! activeModalAction && (
				<ActionModal
					action={ activeModalAction }
					items={ [ item ] }
					closeModal={ () => setActiveModalAction( null ) }
				/>
			) }
		</>
	);
}

export default TimelineItem;
