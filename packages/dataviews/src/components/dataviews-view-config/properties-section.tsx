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
	].filter( ( { field } ) => isDefined( field ) );
	const visibleFieldIds = view.fields ?? [];
	const visibleRegularFieldsCount = regularFields.filter( ( f ) =>
		visibleFieldIds.includes( f.id )
	).length;

	let visibleLockedFields = lockedFields.filter(
		( { field, isVisibleFlag } ) =>
			// @ts-expect-error
			isDefined( field ) && ( view[ isVisibleFlag ] ?? true )
	) as Array< {
		field: NormalizedField< any >;
		isVisibleFlag: string;
	} >;

	// If only one field (locked or regular) is visible, prevent it from being hidden
	const totalVisibleFields =
		visibleLockedFields.length + visibleRegularFieldsCount;
	if ( totalVisibleFields === 1 ) {
		if ( visibleLockedFields.length === 1 ) {
			visibleLockedFields = visibleLockedFields.map( ( locked ) => ( {
				...locked,
				field: { ...locked.field, enableHiding: false },
			} ) );
		}
	}

	const hiddenLockedFields = lockedFields.filter(
		( { field, isVisibleFlag } ) =>
			// @ts-expect-error
			isDefined( field ) && ! ( view[ isVisibleFlag ] ?? true )
	) as Array< {
		field: NormalizedField< any >;
		isVisibleFlag: string;
	} >;

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
					{ visibleLockedFields.map( ( { field, isVisibleFlag } ) => {
						return (
							<FieldItem
								key={ field.id }
								field={ field }
								isVisible
								onToggleVisibility={ () => {
									onChangeView( {
										...view,
										[ isVisibleFlag ]: false,
									} );
								} }
							/>
						);
					} ) }

					{ hiddenLockedFields.map( ( { field, isVisibleFlag } ) => {
						return (
							<FieldItem
								key={ field.id }
								field={ field }
								isVisible={ false }
								onToggleVisibility={ () => {
									onChangeView( {
										...view,
										[ isVisibleFlag ]: true,
									} );
								} }
							/>
						);
					} ) }

					{ regularFields.map( ( field ) => {
						// Check if this is the last visible field to prevent hiding
						const isVisible = visibleFieldIds.includes( field.id );
						const isLastVisible =
							totalVisibleFields === 1 && isVisible;
						const fieldToRender = isLastVisible
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
