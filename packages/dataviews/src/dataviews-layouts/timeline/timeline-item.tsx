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
	Composite,
} from '@wordpress/components';
import {
	useEffect,
	useRef,
	useState,
	useContext,
	useMemo,
} from '@wordpress/element';
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
import type {
	Action,
	NormalizedField,
	ViewTimeline,
	ActionModal as ActionModalType,
} from '../../types';
import {
	generateItemWrapperCompositeId,
	generatePrimaryActionCompositeId,
	generateDropdownTriggerCompositeId,
} from './utils';

const { Menu } = unlock( componentsPrivateApis );

interface TimelineItemProps< Item > {
	view: ViewTimeline;
	actions: Action< Item >[];
	idPrefix: string;
	isSelected: boolean;
	item: Item;
	titleField?: NormalizedField< Item >;
	mediaField?: NormalizedField< Item >;
	descriptionField?: NormalizedField< Item >;
	onSelect: ( item: Item ) => void;
	otherFields: NormalizedField< Item >[];
	onDropdownTriggerKeyDown: React.KeyboardEventHandler< HTMLButtonElement >;
	posinset?: number;
}

function PrimaryActionGridCell< Item >( {
	idPrefix,
	primaryAction,
	item,
}: {
	idPrefix: string;
	primaryAction: Action< Item >;
	item: Item;
} ) {
	const registry = useRegistry();
	const [ isModalOpen, setIsModalOpen ] = useState( false );

	const compositeItemId = generatePrimaryActionCompositeId(
		idPrefix,
		primaryAction.id
	);

	const label =
		typeof primaryAction.label === 'string'
			? primaryAction.label
			: primaryAction.label( [ item ] );

	return 'RenderModal' in primaryAction ? (
		<div role="gridcell" key={ primaryAction.id }>
			<Composite.Item
				id={ compositeItemId }
				render={
					<Button
						disabled={ !! primaryAction.disabled }
						accessibleWhenDisabled
						size="small"
						onClick={ () => setIsModalOpen( true ) }
						variant="link"
					>
						{ label }
					</Button>
				}
			>
				{ isModalOpen && (
					<ActionModal< Item >
						action={ primaryAction }
						items={ [ item ] }
						closeModal={ () => setIsModalOpen( false ) }
					/>
				) }
			</Composite.Item>
		</div>
	) : (
		<div role="gridcell" key={ primaryAction.id }>
			<Composite.Item
				id={ compositeItemId }
				render={
					<Button
						disabled={ !! primaryAction.disabled }
						accessibleWhenDisabled
						size="small"
						onClick={ () => {
							primaryAction.callback( [ item ], { registry } );
						} }
						variant="link"
					>
						{ label }
					</Button>
				}
			/>
		</div>
	);
}

function TimelineSpacer() {
	return <div className="dataviews-view-timeline__spacer" />;
}

function TimelineItem< Item >( {
	view,
	actions,
	idPrefix,
	isSelected,
	item,
	titleField,
	mediaField,
	descriptionField,
	onSelect,
	otherFields,
	onDropdownTriggerKeyDown,
	posinset,
}: TimelineItemProps< Item > ) {
	const {
		showTitle = true,
		showMedia = true,
		showDescription = true,
		infiniteScrollEnabled,
	} = view;
	const itemRef = useRef< HTMLDivElement >( null );
	const labelId = `${ idPrefix }-label`;
	const descriptionId = `${ idPrefix }-description`;

	const registry = useRegistry();
	const [ isHovered, setIsHovered ] = useState( false );
	const [ activeModalAction, setActiveModalAction ] = useState(
		null as ActionModalType< Item > | null
	);
	const handleHover: React.MouseEventHandler = ( { type } ) => {
		const isHover = type === 'mouseenter';
		setIsHovered( isHover );
	};

	const { paginationInfo } = useContext( DataViewsContext );
	useEffect( () => {
		if ( isSelected ) {
			itemRef.current?.scrollIntoView( {
				behavior: 'auto',
				block: 'nearest',
				inline: 'nearest',
			} );
		}
	}, [ isSelected ] );

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

	const hasOnlyOnePrimaryAction = primaryAction && actions.length === 1;

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

	const usedActions = eligibleActions?.length > 0 && (
		<HStack spacing={ 3 } className="dataviews-view-timeline__item-actions">
			{ primaryAction && (
				<PrimaryActionGridCell
					idPrefix={ idPrefix }
					primaryAction={ primaryAction }
					item={ item }
				/>
			) }
			{ ! hasOnlyOnePrimaryAction && (
				<div role="gridcell">
					<Menu placement="bottom-end">
						<Menu.TriggerButton
							render={
								<Composite.Item
									id={ generateDropdownTriggerCompositeId(
										idPrefix
									) }
									render={
										<Button
											size="small"
											icon={ moreVertical }
											label={ __( 'Actions' ) }
											accessibleWhenDisabled
											disabled={ ! actions.length }
											onKeyDown={
												onDropdownTriggerKeyDown
											}
										/>
									}
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
					{ !! activeModalAction && (
						<ActionModal
							action={ activeModalAction }
							items={ [ item ] }
							closeModal={ () => setActiveModalAction( null ) }
						/>
					) }
				</div>
			) }
		</HStack>
	);

	return (
		<Composite.Row
			ref={ itemRef }
			render={
				/* aria-posinset breaks Composite.Row if passed to it directly. */
				<div
					aria-posinset={ posinset }
					aria-setsize={
						infiniteScrollEnabled
							? paginationInfo.totalItems
							: undefined
					}
				/>
			}
			role={ infiniteScrollEnabled ? 'article' : 'row' }
			className={ clsx( {
				'is-selected': isSelected,
				'is-hovered': isHovered,
			} ) }
			onMouseEnter={ handleHover }
			onMouseLeave={ handleHover }
		>
			<HStack
				className="dataviews-view-timeline__item-wrapper"
				spacing={ 0 }
			>
				<div role="gridcell">
					<Composite.Item
						id={ generateItemWrapperCompositeId( idPrefix ) }
						aria-pressed={ isSelected }
						aria-labelledby={ labelId }
						aria-describedby={ descriptionId }
						className="dataviews-view-timeline__item"
						onClick={ () => onSelect( item ) }
					/>
				</div>
				<HStack spacing={ 3 } justify="start" alignment="flex-start">
					<VStack
						spacing={ 1 }
						className="dataviews-view-timeline__event-type-wrapper"
					>
						<TimelineSpacer />
						{ renderedMediaField }
						<TimelineSpacer />
					</VStack>
					<VStack
						spacing={ 1 }
						className="dataviews-view-timeline__field-wrapper"
					>
						<HStack spacing={ 0 }>
							<div
								className="dataviews-title-field"
								id={ labelId }
							>
								{ renderedTitleField }
							</div>
							{ usedActions }
						</HStack>
						{ showDescription && descriptionField?.render && (
							<div className="dataviews-view-timeline__field">
								<descriptionField.render
									item={ item }
									field={ descriptionField }
								/>
							</div>
						) }
						<div
							className="dataviews-view-timeline__fields"
							id={ descriptionId }
						>
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
					</VStack>
				</HStack>
			</HStack>
		</Composite.Row>
	);
}

export default TimelineItem;
