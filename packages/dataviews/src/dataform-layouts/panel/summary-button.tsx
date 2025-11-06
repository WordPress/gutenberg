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

	return (
		<div className="dataforms-layouts-panel__summary-wrapper">
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
