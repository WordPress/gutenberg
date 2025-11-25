/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { sprintf, _x } from '@wordpress/i18n';
import { pencil } from '@wordpress/icons';
import { useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import type { NormalizedField } from '../../types';

function SummaryButton< Item >( {
	summaryFields,
	data,
	fieldLabel,
	disabled,
	onClick,
	'aria-expanded': ariaExpanded,
}: {
	summaryFields: NormalizedField< Item >[];
	data: Item;
	fieldLabel?: string;
	disabled?: boolean;
	onClick: () => void;
	'aria-expanded'?: boolean;
} ) {
	const summaryId = useInstanceId( SummaryButton, 'dataforms-panel-summary' );
	const summaryContent =
		summaryFields.length > 1 ? (
			<div
				style={ {
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'flex-start',
					width: '100%',
					gap: '2px',
				} }
			>
				{ summaryFields.map( ( summaryField ) => (
					<div key={ summaryField.id } style={ { width: '100%' } }>
						<summaryField.render
							item={ data }
							field={ summaryField }
						/>
					</div>
				) ) }
			</div>
		) : (
			summaryFields.map( ( summaryField ) => (
				<summaryField.render
					key={ summaryField.id }
					item={ data }
					field={ summaryField }
				/>
			) )
		);

	const fieldValues = summaryFields
		.map( ( summaryField ) => {
			return summaryField.getValue( { item: data } );
		} )
		.filter( ( value ) => {
			// Skip empty, null, or undefined values.
			return value !== null && value !== undefined && value !== '';
		} )
		.join( ', ' );

	return (
		<div
			className="dataforms-layouts-panel__summary-wrapper"
			// Make focusable for read-only fields so screen readers can discover the content.
			tabIndex={ disabled ? 0 : undefined }
			role={ disabled ? 'group' : undefined }
			aria-label={
				disabled
					? sprintf(
							// translators: %1$s: Field name. %2$s: Field values.
							_x( '%1$s %2$s (read-only)', 'field' ),
							fieldLabel || '',
							fieldValues || ''
					  )
					: undefined
			}
		>
			<div
				id={ summaryId }
				className="dataforms-layouts-panel__summary-content"
			>
				{ summaryContent }
			</div>
			<Button
				className="dataforms-layouts-panel__edit-button"
				size="compact"
				icon={ pencil }
				aria-expanded={ ariaExpanded }
				aria-label={ sprintf(
					// translators: %s: Field name.
					_x( 'Edit %s', 'field' ),
					fieldLabel || ''
				) }
				aria-describedby={ summaryId }
				onClick={ onClick }
				disabled={ disabled }
				accessibleWhenDisabled
			/>
		</div>
	);
}

export default SummaryButton;
