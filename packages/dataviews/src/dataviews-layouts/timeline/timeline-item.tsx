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
import { Icon, pinSmall, moreVertical } from '@wordpress/icons';
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
	Action,
	NormalizedField,
	ViewTimeline,
	ActionModal as ActionModalType,
} from '../../types';

/**
 * External dependencies
 */
import type { ReactElement, ComponentProps } from 'react';

const { Menu } = unlock( componentsPrivateApis );

interface TimelineItemProps< Item > {
	view: ViewTimeline;
	actions: Action< Item >[];
	item: Item;
	titleField?: NormalizedField< Item >;
	mediaField?: NormalizedField< Item >;
	descriptionField?: NormalizedField< Item >;
	eventField?: NormalizedField< Item > | undefined;
	otherFields: NormalizedField< Item >[];
	posinset?: number;
	onClickItem?: ( item: Item ) => void;
	renderItemLink?: (
		props: {
			item: Item;
		} & ComponentProps< 'a' >
	) => ReactElement;
	isItemClickable: ( item: Item ) => boolean;
}

function TimelineSpacer() {
	return <div className="dataviews-view-timeline__spacer" />;
}

function TimelineItem< Item >( {
	view,
	actions,
	item,
	titleField,
	mediaField,
	descriptionField,
	eventField,
	otherFields,
	posinset,
	onClickItem,
	renderItemLink,
	isItemClickable,
}: TimelineItemProps< Item > ) {
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

	const renderedMediaField =
		showMedia && mediaField?.render ? (
			<div className="dataviews-view-timeline__event-type-icon">
				<mediaField.render
					item={ item }
					field={ mediaField }
					config={ { sizes: '52px' } }
				/>
			</div>
		) : (
			<div className="dataviews-view-timeline__event-type-icon">
				<Icon icon={ pinSmall } />
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
					<VStack
						spacing={ 1 }
						className="dataviews-view-timeline__event-type"
					>
						<TimelineSpacer />
						{ renderedMediaField }
						<TimelineSpacer />
					</VStack>
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
							{ eventField && (
								<div className="dataviews-view-timeline__field dataviews-view-timeline__field--date">
									<VisuallyHidden
										as="span"
										className="dataviews-view-timeline__field-label"
									>
										{ eventField.label }
									</VisuallyHidden>
									<span className="dataviews-view-timeline__field-value">
										<eventField.render
											item={ item }
											field={ eventField }
										/>
									</span>
								</div>
							) }
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
