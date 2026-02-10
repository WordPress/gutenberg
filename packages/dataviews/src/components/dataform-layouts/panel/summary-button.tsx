/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { Icon, Tooltip } from '@wordpress/components';
import { sprintf, _x } from '@wordpress/i18n';
import { error as errorIcon, pencil } from '@wordpress/icons';
import { useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import type {
	NormalizedField,
	NormalizedFormField,
	NormalizedPanelLayout,
} from '../../../types';
import getLabelClassName from './utils/get-label-classname';

export default function SummaryButton< Item >( {
	data,
	field,
	summaryFields,
	fieldLabel,
	disabled,
	onClick,
	'aria-expanded': ariaExpanded,
	'aria-haspopup': ariaHasPopup,
	labelContent,
	showError,
	errorMessage,
}: {
	data: Item;
	field: NormalizedFormField;
	summaryFields: NormalizedField< Item >[];
	fieldLabel?: string;
	disabled?: boolean;
	onClick: () => void;
	'aria-expanded'?: boolean;
	'aria-haspopup'?: 'dialog' | 'menu' | 'listbox' | 'tree' | 'grid';
	labelContent?: React.ReactNode;
	showError?: boolean;
	errorMessage?: string;
} ) {
	const labelPosition = ( field.layout as NormalizedPanelLayout )
		.labelPosition;
	const labelClassName = getLabelClassName( labelPosition, showError );
	const className = clsx(
		'dataforms-layouts-panel__field-trigger',
		`dataforms-layouts-panel__field-trigger--label-${ labelPosition }`
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
		<div className={ className } aria-disabled={ disabled || undefined }>
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
				<button
					type="button"
					className="dataforms-layouts-panel__field-trigger-icon"
					aria-label={ ariaLabel }
					aria-expanded={ ariaExpanded }
					aria-haspopup={ ariaHasPopup }
					aria-describedby={ `${ controlId }` }
					onClick={ onClick }
				>
					<Icon icon={ pencil } size={ 24 } />
				</button>
			) }
		</div>
	);
}
