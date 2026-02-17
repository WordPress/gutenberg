/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { Button, Icon, Tooltip } from '@wordpress/components';
import { sprintf, _x } from '@wordpress/i18n';
import { error as errorIcon, pencil } from '@wordpress/icons';
import { useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import type {
	FieldValidity,
	NormalizedField,
	NormalizedFormField,
	NormalizedPanelLayout,
} from '../../../types';
import getLabelClassName from './utils/get-label-classname';
import getLabelContent from './utils/get-label-content';
import getFirstValidationError from './utils/get-first-validation-error';

export default function SummaryButton< Item >( {
	data,
	field,
	fieldLabel,
	summaryFields,
	validity,
	touched,
	disabled,
	onClick,
	'aria-expanded': ariaExpanded,
}: {
	data: Item;
	field: NormalizedFormField;
	fieldLabel?: string;
	summaryFields: NormalizedField< Item >[];
	validity?: FieldValidity;
	touched: boolean;
	disabled?: boolean;
	onClick: () => void;
	'aria-expanded'?: boolean;
} ) {
	const { labelPosition, editVisibility } =
		field.layout as NormalizedPanelLayout;
	const errorMessage = getFirstValidationError( validity );
	const showError = touched && !! errorMessage;
	const labelClassName = getLabelClassName( labelPosition, showError );
	const labelContent = getLabelContent( showError, errorMessage, fieldLabel );
	const className = clsx(
		'dataforms-layouts-panel__field-trigger',
		`dataforms-layouts-panel__field-trigger--label-${ labelPosition }`,
		{
			'is-disabled': disabled,
			'dataforms-layouts-panel__field-trigger--edit-always':
				editVisibility === 'always',
		}
	);

	const controlId = useInstanceId(
		SummaryButton,
		'dataforms-layouts-panel__field-control'
	);

	const ariaLabel = showError
		? sprintf(
				// translators: %s: Field name.
				_x( 'Edit %s (has errors)', 'field' ),
				fieldLabel || ''
		  )
		: sprintf(
				// translators: %s: Field name.
				_x( 'Edit %s', 'field' ),
				fieldLabel || ''
		  );

	return (
		<div className={ className }>
			{ labelPosition !== 'none' && (
				<span className={ labelClassName }>{ labelContent }</span>
			) }
			{ labelPosition === 'none' && showError && (
				<Tooltip text={ errorMessage } placement="top">
					<span className="dataforms-layouts-panel__field-label-error-content">
						<Icon icon={ errorIcon } size={ 16 } />
					</span>
				</Tooltip>
			) }
			<span
				id={ `${ controlId }` }
				className="dataforms-layouts-panel__field-control"
			>
				{ summaryFields.length > 1 ? (
					<span
						style={ {
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'flex-start',
							width: '100%',
							gap: '2px',
						} }
					>
						{ summaryFields.map( ( summaryField ) => (
							<span
								key={ summaryField.id }
								style={ { width: '100%' } }
							>
								<summaryField.render
									item={ data }
									field={ summaryField }
								/>
							</span>
						) ) }
					</span>
				) : (
					summaryFields.map( ( summaryField ) => (
						<summaryField.render
							key={ summaryField.id }
							item={ data }
							field={ summaryField }
						/>
					) )
				) }
			</span>
			{ ! disabled && (
				<Button
					className="dataforms-layouts-panel__field-trigger-icon"
					label={ ariaLabel }
					showTooltip={ false }
					icon={ pencil }
					size="small"
					aria-expanded={ ariaExpanded }
					aria-haspopup="dialog"
					aria-describedby={ `${ controlId }` }
					onClick={ onClick }
				/>
			) }
		</div>
	);
}
