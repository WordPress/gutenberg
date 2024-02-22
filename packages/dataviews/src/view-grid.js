/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	__experimentalGrid as Grid,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	Tooltip,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useAsyncList } from '@wordpress/compose';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { isAppleOS } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import ItemActions from './item-actions';
import SingleSelectionCheckbox from './single-selection-checkbox';

function GridItem( {
	hasNoPointerEvents,
	selection,
	data,
	onSelectionChange,
	getItemId,
	item,
	actions,
	mediaField,
	primaryField,
	visibleFields,
} ) {
	const id = getItemId( item );
	const isSelected = selection.includes( id );
	return (
		<VStack
			spacing={ 0 }
			key={ id }
			className={ classnames( 'dataviews-view-grid__card', {
				'is-selected': isSelected,
				'has-no-pointer-events': hasNoPointerEvents,
			} ) }
			onClick={ () => {
				if ( ! hasNoPointerEvents ) return;

				const setAsSelected = ! isSelected;
				const selectedData = data.filter( ( _item ) => {
					const _id = getItemId?.( _item );
					const currentlyIncluded = selection.includes( _id );
					return setAsSelected
						? id === _id || currentlyIncluded
						: id !== _id && currentlyIncluded;
				} );
				onSelectionChange( selectedData );
			} }
		>
			<div
				className="dataviews-view-grid__content"
				inert={ hasNoPointerEvents ? '' : undefined }
			>
				<div className="dataviews-view-grid__media">
					{ mediaField?.render( { item } ) }
				</div>
				<HStack
					justify="space-between"
					className="dataviews-view-grid__title-actions"
				>
					<SingleSelectionCheckbox
						id={ id }
						item={ item }
						selection={ selection }
						onSelectionChange={ onSelectionChange }
						getItemId={ getItemId }
						data={ data }
						primaryField={ primaryField }
					/>
					<HStack className="dataviews-view-grid__primary-field">
						{ primaryField?.render( { item } ) }
					</HStack>
					<ItemActions item={ item } actions={ actions } isCompact />
				</HStack>
				<VStack className="dataviews-view-grid__fields" spacing={ 3 }>
					{ visibleFields.map( ( field ) => {
						const renderedValue = field.render( {
							item,
						} );
						if ( ! renderedValue ) {
							return null;
						}
						return (
							<VStack
								className="dataviews-view-grid__field"
								key={ field.id }
								spacing={ 1 }
							>
								<Tooltip text={ field.header } placement="left">
									<div className="dataviews-view-grid__field-value">
										{ renderedValue }
									</div>
								</Tooltip>
							</VStack>
						);
					} ) }
				</VStack>
			</div>
			{ hasNoPointerEvents && (
				<div
					className="dataviews-view-grid__overlay"
					role="checkbox"
					aria-label={ primaryField?.getValue( { item } ) }
					aria-checked={ isSelected }
				/>
			) }
		</VStack>
	);
}

export default function ViewGrid( {
	data,
	fields,
	view,
	actions,
	isLoading,
	getItemId,
	deferredRendering,
	selection,
	onSelectionChange,
} ) {
	const gridRef = useRef( null );
	const eventControllerRef = useRef( null );
	const [ hasNoPointerEvents, setHasNoPointerEvents ] = useState( false );
	const [ pointerIsWithinBounds, setPointerIsWithinBounds ] =
		useState( false );

	const pointerIsWithinBoundsHandler = useCallback(
		( { metaKey, ctrlKey, type } ) => {
			const isWithinBounds = type === 'mouseenter';
			const isKeyPressed = isAppleOS() ? metaKey : ctrlKey;
			setPointerIsWithinBounds( isWithinBounds );
			setHasNoPointerEvents( isWithinBounds && isKeyPressed );
		},
		[]
	);

	useEffect( () => {
		if ( eventControllerRef.current ) {
			eventControllerRef.current.abort();
		}

		const doc = gridRef.current?.ownerDocument;
		if ( ! doc ) return;

		if ( pointerIsWithinBounds ) {
			const listener = ( { key, type } ) => {
				if ( key === ( isAppleOS() ? 'Meta' : 'Control' ) ) {
					setHasNoPointerEvents( type === 'keydown' );
				}
			};
			const controller = new AbortController();
			controller.signal.addEventListener( 'abort', () => {
				eventControllerRef.current = null;
			} );
			const config = { capture: true, signal: controller.signal };
			doc.body.addEventListener( 'keydown', listener, config );
			doc.body.addEventListener( 'keyup', listener, config );
			eventControllerRef.current = controller;

			return () => controller.abort();
		}
	}, [ pointerIsWithinBounds ] );

	const mediaField = fields.find(
		( field ) => field.id === view.layout.mediaField
	);
	const primaryField = fields.find(
		( field ) => field.id === view.layout.primaryField
	);
	const visibleFields = fields.filter(
		( field ) =>
			! view.hiddenFields.includes( field.id ) &&
			! [ view.layout.mediaField, view.layout.primaryField ].includes(
				field.id
			)
	);
	const shownData = useAsyncList( data, { step: 3 } );
	const usedData = deferredRendering ? shownData : data;
	const hasData = !! usedData?.length;
	return (
		<>
			{ hasData && (
				<Grid
					ref={ gridRef }
					gap={ 6 }
					columns={ 2 }
					alignment="top"
					className="dataviews-view-grid"
					aria-busy={ isLoading }
					onMouseEnter={ pointerIsWithinBoundsHandler }
					onMouseLeave={ pointerIsWithinBoundsHandler }
				>
					{ usedData.map( ( item ) => {
						return (
							<GridItem
								key={ getItemId( item ) }
								hasNoPointerEvents={ hasNoPointerEvents }
								selection={ selection }
								data={ data }
								onSelectionChange={ onSelectionChange }
								getItemId={ getItemId }
								item={ item }
								actions={ actions }
								mediaField={ mediaField }
								primaryField={ primaryField }
								visibleFields={ visibleFields }
							/>
						);
					} ) }
				</Grid>
			) }
			{ ! hasData && (
				<div
					className={ classnames( {
						'dataviews-loading': isLoading,
						'dataviews-no-results': ! isLoading,
					} ) }
				>
					<p>{ isLoading ? __( 'Loading…' ) : __( 'No results' ) }</p>
				</div>
			) }
		</>
	);
}
