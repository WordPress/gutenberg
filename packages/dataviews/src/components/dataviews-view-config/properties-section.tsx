/**
 * WordPress dependencies
 */
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
	BaseControl,
	Icon,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useContext } from '@wordpress/element';
import { check } from '@wordpress/icons';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import type { NormalizedField } from '../../types';
import DataViewsContext from '../dataviews-context';
import getHideableFields from '../../utils/get-hideable-fields';

function FieldItem( {
	field,
	isVisible,
	onToggleVisibility,
}: {
	field: NormalizedField< any >;
	isVisible: boolean;
	onToggleVisibility?: () => void;
} ) {
	return (
		<Item onClick={ field.enableHiding ? onToggleVisibility : undefined }>
			<Stack direction="row" gap="xs" justify="flex-start" align="center">
				<div style={ { height: 24, width: 24 } }>
					{ isVisible && <Icon icon={ check } /> }
				</div>
				<span className="dataviews-view-config__label">
					{ field.label }
				</span>
			</Stack>
		</Item>
	);
}

function isDefined< T >( item: T | undefined ): item is T {
	return !! item;
}

export function PropertiesSection( {
	showLabel = true,
}: {
	showLabel?: boolean;
} ) {
	const { view, fields, onChangeView } = useContext( DataViewsContext );

	// Get all regular fields (non-locked) in their original order from fields prop
	const regularFields = getHideableFields( view, fields );

	if ( ! regularFields?.length ) {
		return null;
	}
	const titleField = fields.find( ( f ) => f.id === view.titleField );
	const previewField = fields.find( ( f ) => f.id === view.mediaField );
	const descriptionField = fields.find(
		( f ) => f.id === view.descriptionField
	);

	const lockedFields = [
		{
			field: titleField,
			isVisibleFlag: 'showTitle',
		},
		{
			field: previewField,
			isVisibleFlag: 'showMedia',
		},
		{
			field: descriptionField,
			isVisibleFlag: 'showDescription',
		},
	].filter( ( { field } ) => isDefined( field ) ) as Array< {
		field: NormalizedField< any >;
		isVisibleFlag: string;
	} >;
	const visibleFieldIds = view.fields ?? [];
	const visibleRegularFieldsCount = regularFields.filter( ( f ) =>
		visibleFieldIds.includes( f.id )
	).length;

	const visibleLockedFields = lockedFields.filter(
		( { isVisibleFlag } ) =>
			// @ts-expect-error
			view[ isVisibleFlag ] ?? true
	);

	// If only one field (locked or regular) is visible, prevent it from being hidden
	const totalVisibleFields =
		visibleLockedFields.length + visibleRegularFieldsCount;
	const isSingleVisibleLockedField =
		totalVisibleFields === 1 && visibleLockedFields.length === 1;

	return (
		<Stack direction="column" className="dataviews-field-control">
			{ showLabel && (
				<BaseControl.VisualLabel>
					{ __( 'Properties' ) }
				</BaseControl.VisualLabel>
			) }
			<Stack
				direction="column"
				className="dataviews-view-config__properties"
			>
				<ItemGroup isBordered isSeparated size="medium">
					{ lockedFields.map( ( { field, isVisibleFlag } ) => {
						// @ts-expect-error
						const isVisible = view[ isVisibleFlag ] ?? true;
						const fieldToRender =
							isSingleVisibleLockedField && isVisible
								? { ...field, enableHiding: false }
								: field;

						return (
							<FieldItem
								key={ field.id }
								field={ fieldToRender }
								isVisible={ isVisible }
								onToggleVisibility={ () => {
									onChangeView( {
										...view,
										[ isVisibleFlag ]: ! isVisible,
									} );
								} }
							/>
						);
					} ) }

					{ regularFields.map( ( field ) => {
						// Check if this is the last visible field to prevent hiding
						const isVisible = visibleFieldIds.includes( field.id );
						const fieldToRender =
							totalVisibleFields === 1 && isVisible
								? { ...field, enableHiding: false }
								: field;

						return (
							<FieldItem
								key={ field.id }
								field={ fieldToRender }
								isVisible={ isVisible }
								onToggleVisibility={ () => {
									onChangeView( {
										...view,
										fields: isVisible
											? visibleFieldIds.filter(
													( fieldId ) =>
														fieldId !== field.id
											  )
											: [ ...visibleFieldIds, field.id ],
									} );
								} }
							/>
						);
					} ) }
				</ItemGroup>
			</Stack>
		</Stack>
	);
}
