/**
 * External dependencies
 */
import clsx from 'clsx';
import * as Ariakit from '@ariakit/react';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import {
	__experimentalHStack as HStack,		
	__experimentalVStack as VStack,
	Spinner,
	VisuallyHidden,
} from '@wordpress/components';
import { useCallback, useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type {
	Data,
	Item,
	NormalizedField,
	ViewList as ViewListType,
} from './types';

interface ListViewProps {
	actions: [];
	data: Data;
	fields: NormalizedField[];
	getItemId: ( item: Item ) => string;
	id: string;
	isLoading: boolean;
	onSelectionChange: ( selection: Item[] ) => void;
	selection: Item[];
	view: ViewListType;
}

interface ListViewItemProps {
	actions: [];
	id?: string;
	isSelected: boolean;
	item: Item;
	mediaField?: NormalizedField;
	onSelect: ( item: Item ) => void;
	primaryField?: NormalizedField;
	store: any;
	visibleFields: NormalizedField[];
}

function ListItem( {
	actions,
	id,
	item,
	isSelected,
	onSelect,
	mediaField,
	primaryField,
	store,
	visibleFields,
}: ListViewItemProps ) {
	const itemRef = useRef< HTMLElement >( null );
	const labelId = `${ id }-label`;
	const descriptionId = `${ id }-description`;

	useEffect( () => {
		if ( isSelected ) {
			itemRef.current?.scrollIntoView( {
				behavior: 'auto',
				block: 'nearest',
				inline: 'nearest',
			} );
		}
	}, [ isSelected ] );

	return (
		<Ariakit.CompositeRow
			render={ <li /> }
			role="row"
			className={ clsx( {
				'is-selected': isSelected,
			} ) }
		>
			<HStack className="dataviews-view-list__item-wrapper">
				<div role="gridcell">
					<Ariakit.CompositeItem
						store={ store }
						render={ <div /> }
						role="button"
						id={ id }
						aria-pressed={ isSelected }
						aria-labelledby={ labelId }
						aria-describedby={ descriptionId }
						className="dataviews-view-list__item"
						onClick={ () => onSelect( item ) }
					>
						<HStack
							spacing={ 3 }
							justify="start"
							alignment="flex-start"
						>
							<div className="dataviews-view-list__media-wrapper">
								{ mediaField?.render( { item } ) || (
									<div className="dataviews-view-list__media-placeholder"></div>
								) }
							</div>
							<VStack spacing={ 1 }>
								<span
									className="dataviews-view-list__primary-field"
									id={ labelId }
								>
									{ primaryField?.render( { item } ) }
								</span>
								<div
									className="dataviews-view-list__fields"
									id={ descriptionId }
								>
									{ visibleFields.map( ( field ) => (
										<div
											key={ field.id }
											className="dataviews-view-list__field"
										>
											<VisuallyHidden
												as="span"
												className="dataviews-view-list__field-label"
											>
												{ field.header }
											</VisuallyHidden>
											<span className="dataviews-view-list__field-value">
												{ field.render( { item } ) }
											</span>
										</div>
									) ) }
								</div>
							</VStack>
						</HStack>
					</Ariakit.CompositeItem>
				</div>
				{ actions && (
					<div role="gridcell">
						<Ariakit.MenuProvider>
							<Ariakit.CompositeItem
								store={ store }
								render={
									<Ariakit.MenuButton>
										Menu
									</Ariakit.MenuButton>
								}
							/>
							<Ariakit.Menu>
								<Ariakit.MenuItem>Hello</Ariakit.MenuItem>
							</Ariakit.Menu>
						</Ariakit.MenuProvider>
					</div>
				) }
			</HStack>
		</Ariakit.CompositeRow>
	);
}

export default function ViewList( props: ListViewProps ) {
	const {
		actions,
		data,
		fields,
		getItemId,
		isLoading,
		onSelectionChange,
		selection,
		view,
	} = props;
	const baseId = useInstanceId( ViewList, 'view-list' );
	const selectedItem = data?.findLast( ( item ) =>
		selection.includes( item.id )
	);

	const mediaField = fields.find(
		( field ) => field.id === view.layout.mediaField
	);
	const primaryField = fields.find(
		( field ) => field.id === view.layout.primaryField
	);
	const visibleFields = fields.filter(
		( field ) =>
			! view.hiddenFields.includes( field.id ) &&
			! [ view.layout.primaryField, view.layout.mediaField ].includes(
				field.id
			)
	);

	const onSelect = useCallback(
		( item: Item ) => onSelectionChange( [ item ] ),
		[ onSelectionChange ]
	);

	const getItemDomId = useCallback(
		( item?: Item ) =>
			item ? `${ baseId }-${ getItemId( item ) }` : undefined,
		[ baseId, getItemId ]
	);

	const store = Ariakit.useCompositeStore( {
		defaultActiveId: getItemDomId( selectedItem ),
	} );

	const hasData = data?.length;
	if ( ! hasData ) {
		return (
			<div
				className={ clsx( {
					'dataviews-loading': isLoading,
					'dataviews-no-results': ! hasData && ! isLoading,
				} ) }
			>
				{ ! hasData && (
					<p>{ isLoading ? <Spinner /> : __( 'No results' ) }</p>
				) }
			</div>
		);
	}

	return (
		<Ariakit.Composite
			id={ baseId }
			render={ <ul /> }
			className="dataviews-view-list"
			role="grid"
			store={ store }
		>
			{ data.map( ( item ) => {
				const id = getItemDomId( item );
				return (
					<ListItem
						key={ id }
						id={ id }
						actions={ actions }
						item={ item }
						isSelected={ item === selectedItem }
						onSelect={ onSelect }
						mediaField={ mediaField }
						primaryField={ primaryField }
						store={ store }
						visibleFields={ visibleFields }
					/>
				);
			} ) }
		</Ariakit.Composite>
	);
}
