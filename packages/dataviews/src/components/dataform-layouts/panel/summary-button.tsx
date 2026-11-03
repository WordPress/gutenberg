import clsx from 'clsx';
import { Button } from '@wordpress/components';
import { sprintf, _x } from '@wordpress/i18n';
import { pencil } from '@wordpress/icons';
import { useInstanceId } from '@wordpress/compose';
import type {
	FieldValidity,
	NormalizedField,
	NormalizedFormField,
	NormalizedPanelLayout,
} from '../../../types';
import getLabelClassName from './utils/get-label-classname';
import FieldLabelContent from './field-label-content';
import getFirstValidationError from './utils/get-first-validation-error';

function SummaryValue< Item >( {
	item,
	field,
	showPlaceholderIfEmpty,
}: {
	item: Item;
	field: NormalizedField< Item >;
	showPlaceholderIfEmpty: boolean;
} ) {
	// The same notion of empty as the `required` validator: a field whose
	// empty value differs (an id of `0`, an object) normalizes it in `getValue`.
	if (
		showPlaceholderIfEmpty &&
		field.placeholder &&
		[ undefined, null, '' ].includes( field.getValue( { item } ) )
	) {
		return (
			<span className="dataforms-layouts-panel__field-placeholder">
				{ field.placeholder }
			</span>
		);
	}

	return <field.render item={ item } field={ field } />;
}

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
	const { labelPosition, editVisibility, showPlaceholderIfEmpty } =
		field.layout as NormalizedPanelLayout;
	const errorMessage = getFirstValidationError( validity );
	const showError = touched && !! errorMessage;
	const labelClassName = getLabelClassName( labelPosition, showError );

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
	const errorId = `${ controlId }-error`;

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
						errorId={ errorId }
					/>
				</span>
			) }
			{ labelPosition === 'none' && showError && (
				<FieldLabelContent
					showError
					errorMessage={ errorMessage }
					errorId={ errorId }
				/>
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
								<SummaryValue
									item={ data }
									field={ summaryField }
									showPlaceholderIfEmpty={
										showPlaceholderIfEmpty
									}
								/>
							</span>
						) ) }
					</span>
				) : (
					summaryFields.map( ( summaryField ) => (
						<SummaryValue
							key={ summaryField.id }
							item={ data }
							field={ summaryField }
							showPlaceholderIfEmpty={ showPlaceholderIfEmpty }
						/>
					) )
				) }
			</span>
			{ ! disabled && (
				<Button
					className="dataforms-layouts-panel__field-trigger-icon"
					label={ ariaLabel }
					icon={ pencil }
					size="small"
					aria-expanded={ isOpen }
					aria-haspopup="dialog"
					aria-describedby={
						showError ? `${ controlId } ${ errorId }` : controlId
					}
					onClick={ onClick }
				/>
			) }
		</div>
	);
}
