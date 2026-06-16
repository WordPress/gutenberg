/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	Button,
	FormToggle,
	privateApis as componentsPrivateApis,
	TextControl,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { dragHandle, moreVertical, trash } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { STORE_NAME } from '../../store';
import type { MenuItem } from '../../store/types';
import { unlock } from '../../lock-unlock';
import {
	useSidebarNavigationLayout,
	type SidebarNavigationSection,
} from '../navigation/use-sidebar-navigation-layout';

type DragState =
	| {
			type: 'section';
			sectionId: string;
	  }
	| {
			type: 'item';
			itemId: string;
			sectionId: string;
	  };

const DEFAULT_SECTION_ID = 'default';
const ADVANCED_SECTION_ID = 'advanced';
const { Menu } = unlock( componentsPrivateApis );

function getItemDropIndex(
	section: SidebarNavigationSection,
	dragState: DragState | undefined,
	targetItemId: string | undefined
) {
	if ( ! targetItemId ) {
		return section.itemIds.length;
	}

	const targetIndex = section.itemIds.indexOf( targetItemId );

	if ( targetIndex === -1 ) {
		return section.itemIds.length;
	}

	if ( dragState?.type !== 'item' ) {
		return targetIndex;
	}

	const sourceIndex = section.itemIds.indexOf( dragState.itemId );

	if (
		dragState.sectionId === section.id &&
		sourceIndex !== -1 &&
		sourceIndex < targetIndex
	) {
		return targetIndex - 1;
	}

	return targetIndex;
}

export default function CustomizeNavigation() {
	const menuItems = useSelect(
		( select ) =>
			// @ts-ignore
			select( STORE_NAME ).getMenuItems() as MenuItem[],
		[]
	);
	const layout = useSidebarNavigationLayout( menuItems );
	const dragStateRef = useRef< DragState | undefined >();

	const setCurrentDragState = ( nextDragState: DragState | undefined ) => {
		dragStateRef.current = nextDragState;
	};

	const handleSectionDrop = ( section: SidebarNavigationSection ) => {
		const currentDragState = dragStateRef.current;

		if ( ! currentDragState ) {
			return;
		}

		if ( currentDragState.type === 'section' ) {
			layout.moveSection( currentDragState.sectionId, section.id );
		} else {
			layout.moveItem( currentDragState.itemId, section.id );
		}

		setCurrentDragState( undefined );
	};

	const handleItemDrop = (
		section: SidebarNavigationSection,
		targetItemId: string
	) => {
		const currentDragState = dragStateRef.current;

		if ( currentDragState?.type !== 'item' ) {
			return;
		}

		layout.moveItem(
			currentDragState.itemId,
			section.id,
			getItemDropIndex( section, currentDragState, targetItemId )
		);
		setCurrentDragState( undefined );
	};

	return (
		<div className="boot-sidebar-customize">
			<div className="boot-sidebar-customize__heading">
				{ __( 'Customize navigation' ) }
			</div>
			<div className="boot-sidebar-customize__sections">
				{ layout.sections.map( ( section ) => {
					const isBuiltInPinnedSection =
						section.id === ADVANCED_SECTION_ID;
					const canReorderSection =
						section.id !== DEFAULT_SECTION_ID &&
						! isBuiltInPinnedSection;
					const sectionItems = section.itemIds
						.map( ( itemId ) => layout.getItemById( itemId ) )
						.filter( ( item ): item is MenuItem => !! item );

					return (
						<div
							key={ section.id }
							className={ clsx(
								'boot-sidebar-customize__section',
								{
									'is-hidden': ! layout.isItemVisible(
										section.id
									),
								}
							) }
							draggable={ canReorderSection }
							onDragStart={ ( event ) => {
								if ( canReorderSection ) {
									const nextDragState: DragState = {
										type: 'section',
										sectionId: section.id,
									};
									event.dataTransfer.effectAllowed = 'move';
									event.dataTransfer.setData(
										'text/plain',
										section.id
									);
									setCurrentDragState( nextDragState );
								}
							} }
							onDragOver={ ( event ) => {
								if ( dragStateRef.current ) {
									event.preventDefault();
									event.dataTransfer.dropEffect = 'move';
								}
							} }
							onDrop={ ( event ) => {
								event.preventDefault();
								handleSectionDrop( section );
							} }
							onDragEnd={ () => setCurrentDragState( undefined ) }
						>
							<div className="boot-sidebar-customize__section-header">
								{ section.id !== DEFAULT_SECTION_ID && (
									<Button
										icon={ dragHandle }
										size="compact"
										variant="tertiary"
										label={ __( 'Reorder section' ) }
										disabled={ ! canReorderSection }
										accessibleWhenDisabled
										className="boot-sidebar-customize__drag-handle"
									/>
								) }
								{ section.isCustom ? (
									<TextControl
										__next40pxDefaultSize
										label={ __( 'Section name' ) }
										hideLabelFromVision
										value={ section.label }
										onChange={ ( value ) =>
											layout.updateSectionLabel(
												section.id,
												value
											)
										}
									/>
								) : (
									<div className="boot-sidebar-customize__section-title">
										{ section.label }
									</div>
								) }
								{ section.id !== DEFAULT_SECTION_ID && (
									<FormToggle
										checked={ layout.isItemVisible(
											section.id
										) }
										onChange={ ( event ) =>
											layout.setItemVisibility(
												section.id,
												event.currentTarget.checked
											)
										}
										aria-label={ sprintf(
											/* translators: %s: section name. */
											__( 'Show %s section' ),
											section.label
										) }
									/>
								) }
								{ section.isCustom && (
									<Button
										icon={ trash }
										size="compact"
										variant="tertiary"
										label={ __( 'Remove section' ) }
										onClick={ () =>
											layout.removeSection( section.id )
										}
									/>
								) }
							</div>
							<div
								className="boot-sidebar-customize__section-items"
								onDragOver={ ( event ) => {
									if (
										dragStateRef.current?.type === 'item'
									) {
										event.preventDefault();
										event.dataTransfer.dropEffect = 'move';
									}
								} }
								onDrop={ ( event ) => {
									event.preventDefault();
									event.stopPropagation();
									handleSectionDrop( section );
								} }
							>
								{ sectionItems.length === 0 && (
									<div className="boot-sidebar-customize__empty-section">
										{ __( 'Drop items here' ) }
									</div>
								) }
								{ sectionItems.map( ( item ) => (
									<div
										key={ item.id }
										className={ clsx(
											'boot-sidebar-customize__item',
											{
												'is-hidden':
													! layout.isItemVisible(
														item.id
													),
											}
										) }
										draggable
										onDragStart={ ( event ) => {
											const nextDragState: DragState = {
												type: 'item',
												itemId: item.id,
												sectionId: section.id,
											};
											event.stopPropagation();
											event.dataTransfer.effectAllowed =
												'move';
											event.dataTransfer.setData(
												'text/plain',
												item.id
											);
											setCurrentDragState(
												nextDragState
											);
										} }
										onDragOver={ ( event ) => {
											if (
												dragStateRef.current?.type ===
												'item'
											) {
												event.preventDefault();
												event.stopPropagation();
												event.dataTransfer.dropEffect =
													'move';
											}
										} }
										onDrop={ ( event ) => {
											event.preventDefault();
											event.stopPropagation();
											handleItemDrop( section, item.id );
										} }
										onDragEnd={ () =>
											setCurrentDragState( undefined )
										}
									>
										<Button
											icon={ dragHandle }
											size="compact"
											variant="tertiary"
											label={ __( 'Reorder item' ) }
											className="boot-sidebar-customize__drag-handle"
										/>
										<span className="boot-sidebar-customize__item-label">
											{ item.label }
										</span>
										<Menu placement="bottom-end">
											<Menu.TriggerButton
												render={
													<Button
														icon={ moreVertical }
														size="compact"
														variant="tertiary"
														label={ __(
															'Item options'
														) }
													/>
												}
											/>
											<Menu.Popover>
												<Menu.Item
													onClick={ () =>
														layout.setItemVisibility(
															item.id,
															! layout.isItemVisible(
																item.id
															)
														)
													}
												>
													<Menu.ItemLabel>
														{ layout.isItemVisible(
															item.id
														)
															? __( 'Hide' )
															: __( 'Show' ) }
													</Menu.ItemLabel>
												</Menu.Item>
												<Menu.Separator />
												<Menu>
													<Menu.SubmenuTriggerItem>
														<Menu.ItemLabel>
															{ __( 'Move to…' ) }
														</Menu.ItemLabel>
													</Menu.SubmenuTriggerItem>
													<Menu.Popover>
														{ layout.sections.map(
															(
																targetSection
															) => (
																<Menu.Item
																	key={
																		targetSection.id
																	}
																	disabled={
																		targetSection.id ===
																		section.id
																	}
																	onClick={ () => {
																		if (
																			targetSection.id !==
																			section.id
																		) {
																			layout.moveItem(
																				item.id,
																				targetSection.id
																			);
																		}
																	} }
																>
																	<Menu.ItemLabel>
																		{
																			targetSection.label
																		}
																	</Menu.ItemLabel>
																</Menu.Item>
															)
														) }
													</Menu.Popover>
												</Menu>
											</Menu.Popover>
										</Menu>
									</div>
								) ) }
							</div>
						</div>
					);
				} ) }
			</div>
		</div>
	);
}
