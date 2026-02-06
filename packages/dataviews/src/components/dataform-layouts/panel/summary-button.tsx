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

/**
 * Internal dependencies
 */
import type { NormalizedField } from '../../../types';

export default function SummaryButton< Item >( {
	summaryFields,
	data,
	labelPosition,
	fieldLabel,
	disabled,
	onClick,
	'aria-expanded': ariaExpanded,
	labelContent,
	labelClassName,
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
	labelContent?: React.ReactNode;
	labelClassName?: string;
	showError?: boolean;
	errorMessage?: string;
} ) {
	const className = clsx(
		'dataforms-layouts-panel__field-trigger',
		`dataforms-layouts-panel__field-trigger--label-${ labelPosition }`
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
			<span className="dataforms-layouts-panel__field-control">
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
					aria-label={ sprintf(
						// translators: %s: Field name.
						_x( 'Edit %s', 'field' ),
						fieldLabel || ''
					) }
					aria-expanded={ ariaExpanded }
					onClick={ onClick }
				>
					<Icon icon={ pencil } size={ 24 } />
				</button>
			) }
		</div>
	);
}
