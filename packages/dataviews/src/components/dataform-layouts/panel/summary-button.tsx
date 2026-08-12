import clsx from 'clsx';
import { Button, Icon as WCIcon } from '@wordpress/components';
import { sprintf, _x } from '@wordpress/i18n';
import { error as errorIcon, pencil } from '@wordpress/icons';
import { useInstanceId } from '@wordpress/compose';
import { Tooltip } from '@wordpress/ui';
import { useRef } from '@wordpress/element';
import type {
	FieldValidity,
	NormalizedField,
	NormalizedFormField,
	NormalizedPanelLayout,
} from '../../../types';
import getLabelClassName from './utils/get-label-classname';
import FieldLabelContent from './field-label-content';
import getFirstValidationError from './utils/get-first-validation-error';

export default function SummaryButton< Item >( {
	data,
	field,
	fieldLabel,
	summaryFields,
	validity,
	touched,
	disabled,
	isOpen,
	onClick,
}: {
	data: Item;
	field: NormalizedFormField;
	fieldLabel?: string;
	summaryFields: NormalizedField< Item >[];
	validity?: FieldValidity;
	touched: boolean;
	disabled?: boolean;
	isOpen: boolean;
	onClick: () => void;
} ) {
	const { labelPosition, editVisibility } =
		field.layout as NormalizedPanelLayout;
	const errorMessage = getFirstValidationError( validity );
	const showError = touched && !! errorMessage;
	const labelClassName = getLabelClassName( labelPosition, showError );

	const editButtonRef = useRef< HTMLButtonElement >( null );
	// The error label/icon stacks above the edit button's stretched hit area
	// so that its tooltip stays hoverable, which also intercepts clicks: relay
	// them to the edit button, keeping it the single real trigger.
	const activateEditButton = () => {
		editButtonRef.current?.focus();
		editButtonRef.current?.click();
	};

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
				<span className={ labelClassName }>
					<FieldLabelContent
						showError={ showError }
						errorMessage={ errorMessage }
						fieldLabel={ fieldLabel }
						onErrorClick={ activateEditButton }
					/>
				</span>
			) }
			{ labelPosition === 'none' && showError && (
				<Tooltip.Root>
					<Tooltip.Trigger
						onClick={ activateEditButton }
						render={
							<span
								className="dataforms-layouts-panel__field-label-error-content"
								role="img"
								aria-label={ errorMessage }
							>
								<WCIcon icon={ errorIcon } size={ 16 } />
							</span>
						}
					/>
					<Tooltip.Popup>{ errorMessage }</Tooltip.Popup>
				</Tooltip.Root>
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
					ref={ editButtonRef }
					className="dataforms-layouts-panel__field-trigger-icon"
					label={ ariaLabel }
					icon={ pencil }
					size="small"
					aria-expanded={ isOpen }
					aria-haspopup="dialog"
					aria-describedby={ `${ controlId }` }
					onClick={ onClick }
				/>
			) }
		</div>
	);
}
