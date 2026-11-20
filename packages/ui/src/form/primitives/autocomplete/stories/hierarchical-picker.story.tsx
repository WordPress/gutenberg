import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties } from 'react';
import { useId, useRef, useState } from '@wordpress/element';
import { check, chevronRight, reset, search } from '@wordpress/icons';
import * as Autocomplete from '../index';
import * as Breadcrumb from '../../../../breadcrumb';
import { Button } from '../../../../button';
import { Icon } from '../../../../icon';
import { Stack } from '../../../../stack';
import { Text } from '../../../../text';
import { Input } from '../../input';
import { InputLayout } from '../../input-layout';
import { CATEGORY_TREE, type FixtureTreeItem } from './fixtures';

const meta: Meta< typeof Autocomplete.Root > = {
	title: 'Components/@wordpress-ui/Form/Primitives/Autocomplete/Hierarchical Picker',
	id: 'design-system-components-form-primitives-autocomplete-hierarchical-picker',
	tags: [ '!autodocs' ],
	component: Autocomplete.Root,
	parameters: {
		controls: { disable: true },
	},
	decorators: [
		( Story ) => (
			<div style={ { maxWidth: 320 } }>
				<Story />
			</div>
		),
	],
};
export default meta;

type Story = StoryObj< typeof Autocomplete.Root >;

type CheckedState = 'checked' | 'mixed' | 'unchecked';

interface PickerAction {
	id: string;
	item: FixtureTreeItem;
	action: 'toggle' | 'browse';
}

function flattenTree( items: FixtureTreeItem[] ): FixtureTreeItem[] {
	return items.flatMap( ( item ) => [
		item,
		...flattenTree( item.children ?? [] ),
	] );
}

const ALL_ITEMS = flattenTree( CATEGORY_TREE );

const PARENT_BY_ID = new Map(
	ALL_ITEMS.flatMap( ( parent ) =>
		( parent.children ?? [] ).map( ( child ) => [ child.id, parent ] )
	)
);

// Base UI resolves a highlighted cell to `items[ domIndex ]`, so each item's
// actions must be in the same order as its cells in the DOM.
const ACTIONS_BY_ID = new Map(
	ALL_ITEMS.map( ( item ): [ string, PickerAction[] ] => [
		item.id,
		[
			{ id: `${ item.id }-toggle`, item, action: 'toggle' },
			...( item.children?.length
				? [
						{
							id: `${ item.id }-browse`,
							item,
							action: 'browse' as const,
						},
					]
				: [] ),
		],
	] )
);

function getAncestors( item: FixtureTreeItem ): FixtureTreeItem[] {
	const parent = PARENT_BY_ID.get( item.id );
	return parent ? [ ...getAncestors( parent ), parent ] : [];
}

function getBranchIds( item: FixtureTreeItem ): string[] {
	return [ item.id, ...( item.children ?? [] ).flatMap( getBranchIds ) ];
}

function getCheckedState(
	item: FixtureTreeItem,
	topmostSelectedIds: string[]
): CheckedState {
	if (
		[ ...getAncestors( item ), item ].some( ( node ) =>
			topmostSelectedIds.includes( node.id )
		)
	) {
		return 'checked';
	}

	if ( ! item.children?.length ) {
		return 'unchecked';
	}

	const childStates = item.children.map( ( child ) =>
		getCheckedState( child, topmostSelectedIds )
	);

	if ( childStates.every( ( state ) => state === 'checked' ) ) {
		return 'checked';
	}

	return childStates.some( ( state ) => state !== 'unchecked' )
		? 'mixed'
		: 'unchecked';
}

function applyChecked(
	topmostSelectedIds: string[],
	item: FixtureTreeItem,
	checked: boolean
): string[] {
	const ancestors = getAncestors( item );
	const selectedAncestorIndex = ancestors.findIndex( ( ancestor ) =>
		topmostSelectedIds.includes( ancestor.id )
	);

	if ( selectedAncestorIndex !== -1 ) {
		if ( checked ) {
			return topmostSelectedIds;
		}

		const path = [ ...ancestors, item ];
		const siblingIds = ancestors
			.slice( selectedAncestorIndex )
			.flatMap( ( ancestor, index ) =>
				( ancestor.children ?? [] )
					.filter(
						( child ) =>
							child !== path[ selectedAncestorIndex + index + 1 ]
					)
					.map( ( child ) => child.id )
			);

		return [
			...topmostSelectedIds.filter(
				( id ) => id !== ancestors[ selectedAncestorIndex ].id
			),
			...siblingIds,
		];
	}

	const branchIds = getBranchIds( item );
	const nextSelectedIds = topmostSelectedIds.filter(
		( id ) => ! branchIds.includes( id )
	);

	return checked ? [ ...nextSelectedIds, item.id ] : nextSelectedIds;
}

function matchesQuery( item: FixtureTreeItem, query: string ) {
	return [ ...getAncestors( item ), item ].some( ( node ) =>
		node.value.toLowerCase().includes( query )
	);
}

const CHECKED_STATE_LABELS: Record< CheckedState, string > = {
	checked: 'selected',
	mixed: 'partially selected',
	unchecked: 'not selected',
};

const popupHeaderStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--wpds-dimension-gap-sm)',
	padding: 'var(--wpds-dimension-padding-md)',
	borderBlockEnd:
		'var(--wpds-border-width-xs) solid var(--wpds-color-stroke-surface-neutral)',
};

const rowStyle: CSSProperties = {
	display: 'flex',
};

const checkboxCellStyle: CSSProperties = {
	flexShrink: 0,
	justifyContent: 'center',
	width: 'var(--wpds-dimension-size-md)',
	marginInlineEnd: 0,
	paddingInline: 0,
};

const labelCellStyle: CSSProperties = {
	display: 'grid',
	gridTemplateColumns: 'minmax(0, 1fr)',
	flex: 1,
	minWidth: 0,
};

const leafLabelCellStyle: CSSProperties = {
	...labelCellStyle,
	alignItems: 'center',
	minHeight: 'var(--wpds-dimension-size-md)',
	marginInline: 'var(--wp-ui-popup-padding)',
	paddingBlock: 'var(--wpds-dimension-padding-xs)',
	paddingInline: 'var(--wpds-dimension-padding-sm)',
	color: 'var(--wpds-color-foreground-interactive-neutral)',
};

const labelLayoutStyle: CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	gap: 'var(--wpds-dimension-gap-xs)',
};

const countStyle: CSSProperties = {
	marginInlineStart: 'auto',
};

const weakTextStyle: CSSProperties = {
	color: 'var(--wpds-color-foreground-content-neutral-weak)',
};

const chevronSpacerStyle: CSSProperties = {
	flexShrink: 0,
	width: 16,
};

const checkboxStyle: CSSProperties = {
	position: 'relative',
	display: 'block',
	flexShrink: 0,
	width: 'var(--wpds-dimension-size-2xs)',
	aspectRatio: 1,
	boxSizing: 'border-box',
	borderRadius: 'min(var(--wpds-border-radius-sm), 2px)',
	border: 'var(--wpds-border-width-xs) solid var(--wpds-color-stroke-interactive-neutral)',
	backgroundColor: 'var(--wpds-color-background-interactive-neutral)',
};

const checkboxCheckedStyle: CSSProperties = {
	...checkboxStyle,
	borderColor: 'transparent',
	backgroundColor: 'var(--wpds-color-background-interactive-brand-strong)',
	color: 'var(--wpds-color-foreground-interactive-brand-strong)',
};

const checkboxIconStyle: CSSProperties = {
	position: 'absolute',
	inset: 'calc(0px - var(--wpds-border-width-xs))',
};

function CheckboxIndicator( { checkedState }: { checkedState: CheckedState } ) {
	return (
		<span
			aria-hidden="true"
			style={
				checkedState === 'unchecked'
					? checkboxStyle
					: checkboxCheckedStyle
			}
		>
			{ checkedState !== 'unchecked' && (
				<Icon
					icon={ checkedState === 'mixed' ? reset : check }
					viewBox="4 4 16 16"
					size={ 16 }
					style={ checkboxIconStyle }
				/>
			) }
		</span>
	);
}

function RowLabel( {
	item,
	hasChevron,
	isHighlighted = false,
}: {
	item: FixtureTreeItem;
	hasChevron: boolean;
	isHighlighted?: boolean;
} ) {
	return (
		<>
			{ item.value }
			<span
				style={
					isHighlighted
						? countStyle
						: { ...countStyle, ...weakTextStyle }
				}
			>
				{ item.count }
			</span>
			{ hasChevron ? (
				<Icon icon={ chevronRight } size={ 16 } />
			) : (
				<span style={ chevronSpacerStyle } />
			) }
		</>
	);
}

function HierarchicalPicker() {
	const descriptionIdPrefix = useId();
	const inputRef = useRef< HTMLInputElement >( null );
	const [ query, setQuery ] = useState( '' );
	const [ path, setPath ] = useState< FixtureTreeItem[] >( [] );
	const [ topmostSelectedIds, setTopmostSelectedIds ] = useState< string[] >(
		[]
	);
	const [ highlightedAction, setHighlightedAction ] =
		useState< PickerAction >();

	const normalizedQuery = query.trim().toLowerCase();
	const isSearching = normalizedQuery.length > 0;
	const currentNode = path.at( -1 );
	const visibleItems = isSearching
		? ALL_ITEMS.filter( ( item ) => matchesQuery( item, normalizedQuery ) )
		: ( currentNode?.children ?? CATEGORY_TREE );
	const visibleActions = visibleItems.flatMap(
		( item ) => ACTIONS_BY_ID.get( item.id ) ?? []
	);
	const visibleCheckedStates = visibleItems.map( ( item ) =>
		getCheckedState( item, topmostSelectedIds )
	);

	function browseTo( nextPath: FixtureTreeItem[] ) {
		setPath( nextPath );
		setQuery( '' );
	}

	function browseToAndFocusInput( nextPath: FixtureTreeItem[] ) {
		inputRef.current?.focus();
		browseTo( nextPath );
	}

	function setVisibleChecked( checked: boolean ) {
		setTopmostSelectedIds( ( currentSelectedIds ) =>
			visibleItems.reduce(
				( nextSelectedIds, item ) =>
					applyChecked( nextSelectedIds, item, checked ),
				currentSelectedIds
			)
		);
	}

	const isChecked = ( item?: FixtureTreeItem ) =>
		!! item && getCheckedState( item, topmostSelectedIds ) === 'checked';
	const selectedCount = ALL_ITEMS.filter(
		( item ) =>
			isChecked( item ) && ! isChecked( PARENT_BY_ID.get( item.id ) )
	).length;
	const selectionSummary =
		selectedCount === 0
			? 'No categories selected'
			: `${ selectedCount } ${
					selectedCount === 1 ? 'category' : 'categories'
				} selected`;

	const title = isSearching
		? `Results for “${ query.trim() }”`
		: 'All categories';

	return (
		<Autocomplete.Root
			items={ visibleActions }
			mode="none"
			grid
			openOnInputClick
			value={ query }
			itemToStringValue={ ( action: PickerAction ) => action.id }
			onItemHighlighted={ setHighlightedAction }
			onValueChange={ ( nextValue, eventDetails ) => {
				if ( eventDetails.reason === 'item-press' ) {
					return;
				}
				setQuery( nextValue );
			} }
			onOpenChange={ ( nextOpen, eventDetails ) => {
				if ( ! nextOpen && eventDetails.reason === 'item-press' ) {
					eventDetails.cancel();
				}
			} }
		>
			<Autocomplete.InputGroup>
				<Autocomplete.Input
					ref={ inputRef }
					aria-label="Categories"
					placeholder="Search or browse categories"
					render={
						<Input
							prefix={
								<InputLayout.Slot padding="minimal">
									<Icon icon={ search } />
								</InputLayout.Slot>
							}
						/>
					}
				/>
			</Autocomplete.InputGroup>
			<Autocomplete.Popup width="md">
				<div style={ popupHeaderStyle }>
					{ currentNode && ! isSearching ? (
						<Breadcrumb.Root aria-label="Category level">
							<Breadcrumb.ButtonItem
								onClick={ () => browseToAndFocusInput( [] ) }
							>
								All categories
							</Breadcrumb.ButtonItem>
							{ path.slice( 0, -1 ).map( ( node, index ) => (
								<Breadcrumb.ButtonItem
									key={ node.id }
									onClick={ () =>
										browseToAndFocusInput(
											path.slice( 0, index + 1 )
										)
									}
								>
									{ node.value }
								</Breadcrumb.ButtonItem>
							) ) }
							<Breadcrumb.CurrentItem>
								{ currentNode.value }
							</Breadcrumb.CurrentItem>
						</Breadcrumb.Root>
					) : (
						<Text variant="body-md">{ title }</Text>
					) }
					<Stack direction="row" gap="sm" align="center">
						<Button
							size="compact"
							variant="outline"
							disabled={ visibleCheckedStates.every(
								( state ) => state === 'checked'
							) }
							onClick={ () => setVisibleChecked( true ) }
						>
							{ isSearching ? 'Select matches' : 'Select all' }
						</Button>
						<Button
							size="compact"
							variant="outline"
							disabled={ visibleCheckedStates.every(
								( state ) => state === 'unchecked'
							) }
							onClick={ () => setVisibleChecked( false ) }
						>
							{ isSearching ? 'Clear matches' : 'Clear all' }
						</Button>
					</Stack>
				</div>
				<Autocomplete.Status>{ selectionSummary }</Autocomplete.Status>
				<Autocomplete.Empty>No matching categories.</Autocomplete.Empty>
				<Autocomplete.List
					aria-label={
						isSearching
							? 'Matching categories'
							: ( currentNode?.value ?? 'All categories' )
					}
				>
					<Autocomplete.ListBody>
						{ visibleItems.map( ( item, index ) => {
							const checkedState = visibleCheckedStates[ index ];
							const [ toggleAction, browseAction ] =
								ACTIONS_BY_ID.get( item.id ) ?? [];
							const ancestors = getAncestors( item );
							const pathLabel =
								isSearching && ancestors.length
									? ancestors
											.map( ( node ) => node.value )
											.join( ' › ' )
									: undefined;
							const pathId = `${ descriptionIdPrefix }-${ item.id }`;

							return (
								<Autocomplete.Row
									key={ item.id }
									style={ rowStyle }
								>
									<Autocomplete.Item
										value={ toggleAction }
										aria-label={ `${ item.value }, ${ CHECKED_STATE_LABELS[ checkedState ] }` }
										aria-describedby={
											pathLabel ? pathId : undefined
										}
										style={ checkboxCellStyle }
										onClick={ () =>
											setTopmostSelectedIds(
												( currentSelectedIds ) =>
													applyChecked(
														currentSelectedIds,
														item,
														checkedState !==
															'checked'
													)
											)
										}
									>
										<Autocomplete.ItemLabel>
											<CheckboxIndicator
												checkedState={ checkedState }
											/>
										</Autocomplete.ItemLabel>
									</Autocomplete.Item>
									{ browseAction ? (
										<Autocomplete.Item
											value={ browseAction }
											aria-label={ `Browse ${ item.value }` }
											style={ labelCellStyle }
											onClick={ () =>
												browseTo( [
													...ancestors,
													item,
												] )
											}
										>
											<Autocomplete.ItemLabel
												style={ labelLayoutStyle }
											>
												<RowLabel
													item={ item }
													hasChevron
													isHighlighted={
														highlightedAction ===
														browseAction
													}
												/>
											</Autocomplete.ItemLabel>
											{ pathLabel && (
												<Autocomplete.ItemDescription
													id={ pathId }
												>
													{ pathLabel }
												</Autocomplete.ItemDescription>
											) }
										</Autocomplete.Item>
									) : (
										<div
											aria-hidden="true"
											style={ leafLabelCellStyle }
										>
											<Text
												variant="body-md"
												style={ labelLayoutStyle }
											>
												<RowLabel
													item={ item }
													hasChevron={ false }
												/>
											</Text>
											{ pathLabel && (
												<Text
													id={ pathId }
													variant="body-sm"
													style={ weakTextStyle }
												>
													{ pathLabel }
												</Text>
											) }
										</div>
									) }
								</Autocomplete.Row>
							);
						} ) }
					</Autocomplete.ListBody>
				</Autocomplete.List>
			</Autocomplete.Popup>
		</Autocomplete.Root>
	);
}

/**
 * A feasibility study for a hierarchical, multi-select category picker built
 * from the Autocomplete primitives. It is not a recommended pattern yet.
 *
 * Each row is an `Autocomplete.Row` in a grid. Its first cell toggles the
 * category and shows a checked, mixed, or unchecked state. Branches have a
 * second cell that browses into the category. Leaves have a non-interactive
 * label in its place. While searching, the list shows matches from every level
 * with their path. An item matches when its own name or the name of one of its
 * ancestors contains the query, so searching for a branch also lists everything
 * under it.
 */
export const Default: Story = {
	render: function Template() {
		return <HierarchicalPicker />;
	},
};
