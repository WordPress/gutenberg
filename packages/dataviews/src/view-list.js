/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { useAsyncList } from '@wordpress/compose';
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	Button,
} from '@wordpress/components';
import { ENTER, SPACE } from '@wordpress/keycodes';
import { chevronRight, chevronLeft } from '@wordpress/icons';
import { isRTL, __ } from '@wordpress/i18n';

export default function ViewList( {
	view,
	fields,
	data,
	getItemId,
	onSelectionChange,
	onDetailsChange,
	selection,
	deferredRendering,
} ) {
	const shownData = useAsyncList( data, { step: 3 } );
	const usedData = deferredRendering ? shownData : data;
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

	const onEnter = ( item ) => ( event ) => {
		const { keyCode } = event;
		if ( [ ENTER, SPACE ].includes( keyCode ) ) {
			onSelectionChange( [ item ] );
		}
	};

	return (
		<ul className="dataviews-list-view">
			{ usedData.map( ( item ) => {
				return (
					<li key={ getItemId( item ) }>
						<div
							role="button"
							tabIndex={ 0 }
							aria-pressed={ selection.includes( item.id ) }
							onKeyDown={ onEnter( item ) }
							className={ classNames(
								'dataviews-list-view__item',
								{
									'dataviews-list-view__item-selected':
										selection.includes( item.id ),
								}
							) }
							onClick={ () => onSelectionChange( [ item ] ) }
						>
							<HStack spacing={ 3 } alignment="flex-start">
								<div className="dataviews-list-view__media-wrapper">
									{ mediaField?.render( { item } ) || (
										<div className="dataviews-list-view__media-placeholder"></div>
									) }
								</div>
								<HStack>
									<VStack spacing={ 1 }>
										{ primaryField?.render( { item } ) }
										<div className="dataviews-list-view__fields">
											{ visibleFields.map( ( field ) => {
												return (
													<span
														key={ field.id }
														className="dataviews-list-view__field"
													>
														{ field.render( {
															item,
														} ) }
													</span>
												);
											} ) }
										</div>
									</VStack>
								</HStack>
								{ onDetailsChange && (
									<Button
										className="dataviews-list-view__details-button"
										onClick={ onDetailsChange }
										icon={
											isRTL() ? chevronLeft : chevronRight
										}
										label={ __( 'View details' ) }
										size="compact"
									/>
								) }
							</HStack>
						</div>
					</li>
				);
			} ) }
		</ul>
	);
}
