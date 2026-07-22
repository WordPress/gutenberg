/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { connection, Icon } from '@wordpress/icons';
import { Tooltip, VisuallyHidden } from '@wordpress/ui';

/**
 * Field header for bindable block attributes: the field label followed by a
 * small connection icon that reflects whether the attribute is currently
 * bound to a Block Bindings source.
 *
 * Rendered inside the control's label element, so the visually hidden
 * connection text becomes part of the field's accessible name.
 *
 * @param {Object}  props
 * @param {string}  props.label         The field label.
 * @param {boolean} props.isBound       Whether the attribute is bound to a source.
 * @param {string}  [props.sourceLabel] Human-readable label of the bindings source.
 */
export default function BindingsIndicatorHeader( {
	label,
	isBound,
	sourceLabel,
} ) {
	const connectedText = sourceLabel
		? sprintf(
				// translators: %s: Block bindings source label, e.g. "Post Meta".
				__( 'Connected to %s' ),
				sourceLabel
		  )
		: __( 'Connected' );

	const indicator = (
		<span
			className={ clsx( 'block-editor-block-fields__bindings-indicator', {
				'is-bound': isBound,
			} ) }
		>
			<Icon icon={ connection } size={ 16 } aria-hidden="true" />
		</span>
	);

	return (
		<span className="block-editor-block-fields__field-header">
			{ label }
			{ isBound ? (
				<Tooltip.Root>
					<Tooltip.Trigger render={ indicator } />
					<Tooltip.Popup>{ connectedText }</Tooltip.Popup>
				</Tooltip.Root>
			) : (
				indicator
			) }
			{ isBound && <VisuallyHidden>{ connectedText }</VisuallyHidden> }
		</span>
	);
}

/**
 * Decorates block field definitions with a `header` that shows the bindings
 * indicator for every bindable attribute. Fields whose id is not a bindable
 * attribute are returned unchanged.
 *
 * @param {Object[]} fields                     Block field definitions.
 * @param {Object}   options
 * @param {string[]} options.bindableAttributes Attribute names that support bindings.
 * @param {Object}   [options.bindings]         Current bindings, keyed by attribute name.
 * @param {Object}   options.sources            Registered bindings sources, keyed by source name.
 *
 * @return {Object[]} Field definitions with indicator headers applied.
 */
export function getFieldsWithBindingsIndicators(
	fields,
	{ bindableAttributes, bindings, sources }
) {
	return fields.map( ( field ) => {
		if ( ! bindableAttributes.includes( field.id ) ) {
			return field;
		}

		const binding = bindings?.[ field.id ];

		return {
			...field,
			header: (
				<BindingsIndicatorHeader
					label={ field.label }
					isBound={ !! binding }
					sourceLabel={
						binding ? sources[ binding.source ]?.label : undefined
					}
				/>
			),
		};
	} );
}
