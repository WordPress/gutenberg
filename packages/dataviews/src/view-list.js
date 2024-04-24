/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	privateApis as componentsPrivateApis,
	Spinner,
	VisuallyHidden,
} from '@wordpress/components';
import { useCallback, useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { unlock } from './lock-unlock';

const {
	useCompositeStoreV2: useCompositeStore,
	CompositeV2: Composite,
	CompositeItemV2: CompositeItem,
	CompositeRowV2: CompositeRow,
} = unlock( componentsPrivateApis );

function ListItem( {
	id,
	item,
	isSelected,
	onSelect,
	mediaField,
	primaryField,
	visibleFields,
} ) {
	const itemRef = useRef( null );
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
		<CompositeRow
			ref={ itemRef }
			render={ <li /> }
			role="row"
			className={ classNames( {
				'is-selected': isSelected,
			} ) }
		>
			<HStack className="dataviews-view-list__item-wrapper">
				<div role="gridcell">
					<CompositeItem
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
					</CompositeItem>
				</div>
			</HStack>
		</CompositeRow>
	);
}

export default function ViewList( {
	view,
	fields,
	data,
	isLoading,
	getItemId,
	onSelectionChange,
	selection,
	id: preferredId,
} ) {
	const baseId = useInstanceId( ViewList, 'view-list', preferredId );
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
		( item ) => onSelectionChange( [ item ] ),
		[ onSelectionChange ]
	);

	const getItemDomId = useCallback(
		( item ) => ( item ? `${ baseId }-${ getItemId( item ) }` : undefined ),
		[ baseId, getItemId ]
	);

	const store = useCompositeStore( {
		defaultActiveId: getItemDomId( selectedItem ),
	} );

	const hasData = data?.length;
	if ( ! hasData ) {
		return (
			<div
				className={ classNames( {
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
		<Composite
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
						item={ item }
						isSelected={ item === selectedItem }
						onSelect={ onSelect }
						mediaField={ mediaField }
						primaryField={ primaryField }
						visibleFields={ visibleFields }
					/>
				);
			} ) }
		</Composite>
	);
}
