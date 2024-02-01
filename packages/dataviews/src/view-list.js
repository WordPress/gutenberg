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
import { info } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

export default function ViewList( {
	view,
	fields,
	data,
	isLoading,
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

	const hasData = usedData?.length;
	if ( ! hasData ) {
		return (
			<div
				className={ classNames( {
					'dataviews-loading': isLoading,
					'dataviews-no-results': ! hasData && ! isLoading,
				} ) }
			>
				{ ! hasData && (
					<p>{ isLoading ? __( 'Loading…' ) : __( 'No results' ) }</p>
				) }
			</div>
		);
	}

	return (
		<ul className="dataviews-view-list">
			{ usedData.map( ( item ) => {
				return (
					<li
						key={ getItemId( item ) }
						className={ classNames( {
							'is-selected': selection.includes( item.id ),
						} ) }
					>
						<HStack className="dataviews-view-list__item-wrapper">
							<div
								role="button"
								tabIndex={ 0 }
								aria-pressed={ selection.includes( item.id ) }
								onKeyDown={ onEnter( item ) }
								className="dataviews-view-list__item"
								onClick={ () => onSelectionChange( [ item ] ) }
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
										<span className="dataviews-view-list__primary-field">
											{ primaryField?.render( { item } ) }
										</span>
										<div className="dataviews-view-list__fields">
											{ visibleFields.map( ( field ) => {
												return (
													<span
														key={ field.id }
														className="dataviews-view-list__field"
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
							</div>
							{ onDetailsChange && (
								<Button
									className="dataviews-view-list__details-button"
									onClick={ () =>
										onDetailsChange( [ item ] )
									}
									icon={ info }
									label={ __( 'View details' ) }
									size="compact"
								/>
							) }
						</HStack>
					</li>
				);
			} ) }
		</ul>
	);
}
