/**
 * Internal dependencies
 */
import BindingFieldBadge from './binding-field-badge';

/**
 * Higher-order component that wraps a DataForm field Edit component
 * and adds a binding badge alongside it.
 *
 * @param {Component} FieldEditComponent The field Edit component to wrap.
 * @param {string}    fieldId            The field/attribute identifier.
 * @param {string}    blockName          The block type name.
 * @param {string}    clientId           The block client ID.
 * @param {Object}    blockContext       The block context.
 * @return {Component} Wrapped component with binding badge.
 */
export function withBindingBadge(
	FieldEditComponent,
	fieldId,
	blockName,
	clientId,
	blockContext
) {
	return function FieldEditWithBindingBadge( props ) {
		return (
			<div className="block-fields__field-with-binding">
				<FieldEditComponent { ...props } />
				<BindingFieldBadge
					fieldId={ fieldId }
					blockName={ blockName }
					clientId={ clientId }
					blockContext={ blockContext }
				/>
			</div>
		);
	};
}
