/**
 * WordPress dependencies
 */
import { Button, Icon, Tooltip } from '@wordpress/components';
import { sprintf, _x } from '@wordpress/i18n';
import { error as errorIcon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import type { NormalizedField } from '../../types';

function SummaryButton< Item >( {
	summaryFields,
	data,
	labelPosition,
	fieldLabel,
	disabled,
	onClick,
	'aria-expanded': ariaExpanded,
	showError,
	errorMessage,
}: {
	summaryFields: NormalizedField< Item >[];
	data: Item;
	labelPosition: 'side' | 'top' | 'none';
	fieldLabel?: string;
	disabled?: boolean;
	onClick: () => void;
	'aria-expanded'?: boolean;
	showError?: boolean;
	errorMessage?: string;
} ) {
	return (
		<Button
			className="dataforms-layouts-panel__summary-button"
			size="compact"
			variant={
				[ 'none', 'top' ].includes( labelPosition )
					? 'link'
					: 'tertiary'
			}
			aria-expanded={ ariaExpanded }
			aria-label={ sprintf(
				// translators: %s: Field name.
				_x( 'Edit %s', 'field' ),
				fieldLabel || ''
			) }
			onClick={ onClick }
			disabled={ disabled }
			accessibleWhenDisabled
			style={
				summaryFields.length > 1
					? {
							minHeight: 'auto',
							height: 'auto',
							alignItems: 'flex-start',
					  }
					: undefined
			}
		>
			{ showError && (
				<Tooltip text={ errorMessage } placement="top">
					<span className="dataforms-layouts-panel__field-error-indicator">
						<Icon icon={ errorIcon } size={ 20 } />
					</span>
				</Tooltip>
			) }
			{ summaryFields.length > 1 ? (
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
						<div
							key={ summaryField.id }
							style={ { width: '100%' } }
						>
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
			) }
		</Button>
	);
}

export default SummaryButton;
