/**
 * External dependencies
 */
import clsx from 'clsx';
import type {
	AriaAttributes,
	MouseEventHandler,
	ReactElement,
	Ref,
} from 'react';

/**
 * WordPress dependencies
 */
import { Button, Icon, Tooltip } from '@wordpress/components';
import { sprintf, _x } from '@wordpress/i18n';
import { error as errorIcon, pencil } from '@wordpress/icons';
import { useInstanceId } from '@wordpress/compose';
import { forwardRef, useRef } from '@wordpress/element';

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

interface SummaryButtonProps< Item > {
	data: Item;
	field: NormalizedFormField;
	fieldLabel?: string;
	summaryFields: NormalizedField< Item >[];
	validity?: FieldValidity;
	touched: boolean;
	disabled?: boolean;
	/*
	 * Click handler invoked from both the row's pointer interaction
	 * (`handleRowClick`) and the keyboard handler (`handleKeyDown`). When
	 * `SummaryButton` is composed with `Dialog.Trigger` via the render-prop
	 * pattern, the trigger primitive injects its open-toggle handler here
	 * at runtime; otherwise the parent supplies the click handler
	 * directly (e.g. the `Dropdown` `renderToggle` callback).
	 */
	onClick?: MouseEventHandler;
	/*
	 * The three `aria-*` props below are routed onto the inner pencil
	 * `<Button>` (the only focusable element). Consumers must pass an
	 * explicit `aria-haspopup` value matching what their popup actually
	 * opens (e.g. `"dialog"`, `"menu"`, or `"true"`). When
	 * `Dialog.Trigger` composes this component via render props it
	 * supplies `"dialog"` automatically along with `aria-expanded` /
	 * `aria-controls` for the open/closed state.
	 */
	'aria-expanded'?: boolean;
	'aria-controls'?: string;
	'aria-haspopup'?: AriaAttributes[ 'aria-haspopup' ];
}

/*
 * SummaryButton renders a clickable row `<div>` with a focusable pencil
 * `<Button>` nested inside. When used as `<Dialog.Trigger render={ ... } />`,
 * the trigger primitive clones merged props onto this component; we
 * route them to the matching DOM element:
 *   - `onClick`           → outer `<div>` (fires `handleRowClick` → `onClick()`)
 *   - `aria-expanded` /
 *     `aria-controls` /
 *     `aria-haspopup`     → inner `<Button>` (the only focusable element)
 *   - `ref`               → inner `<Button>` (focus-return target on close)
 *
 * TODO: Restructure SummaryButton so a single element carries the
 * click/keyboard/ARIA contract (the row becomes a real button, or the
 * pencil becomes purely decorative). That removes the need for this
 * manual prop split and makes the trigger surface unambiguous to
 * assistive tech. Tracked as a follow-up to PR #78028.
 */
function SummaryButtonImpl< Item >(
	{
		data,
		field,
		fieldLabel,
		summaryFields,
		validity,
		touched,
		disabled,
		onClick,
		'aria-expanded': ariaExpanded,
		'aria-controls': ariaControls,
		'aria-haspopup': ariaHasPopup,
	}: SummaryButtonProps< Item >,
	ref: Ref< HTMLButtonElement >
) {
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
		SummaryButtonImpl,
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

	const rowRef = useRef< HTMLDivElement >( null );

	const handleRowClick: MouseEventHandler = ( event ) => {
		const selection =
			rowRef.current?.ownerDocument.defaultView?.getSelection();
		if ( selection && selection.toString().length > 0 ) {
			return;
		}
		onClick?.( event );
	};

	const handleKeyDown = ( event: React.KeyboardEvent ) => {
		if (
			event.target === event.currentTarget &&
			( event.key === 'Enter' || event.key === ' ' )
		) {
			event.preventDefault();
			onClick?.( event as unknown as React.MouseEvent< HTMLDivElement > );
		}
	};

	return (
		<div
			ref={ rowRef }
			className={ className }
			onClick={ ! disabled ? handleRowClick : undefined }
			onKeyDown={ ! disabled ? handleKeyDown : undefined }
		>
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
					ref={ ref }
					className="dataforms-layouts-panel__field-trigger-icon"
					label={ ariaLabel }
					icon={ pencil }
					size="small"
					aria-expanded={ ariaExpanded }
					aria-haspopup={ ariaHasPopup }
					aria-controls={ ariaControls }
					aria-describedby={ `${ controlId }` }
				/>
			) }
		</div>
	);
}

const SummaryButton = forwardRef( SummaryButtonImpl ) as < Item >(
	props: SummaryButtonProps< Item > & { ref?: Ref< HTMLButtonElement > }
) => ReactElement;

export default SummaryButton;
