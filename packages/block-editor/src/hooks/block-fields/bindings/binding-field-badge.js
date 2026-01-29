/**
 * WordPress dependencies
 */
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { link, lockSmall, error, linkOff } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { unlock } from '../../../lock-unlock';
import useBindingState from './use-binding-state';
import BindingMenu from './binding-menu';

const { Menu } = unlock( componentsPrivateApis );

/**
 * Badge component that shows binding status and provides access to binding menu.
 *
 * @param {Object} props              Component props.
 * @param {string} props.fieldId      The field/attribute identifier.
 * @param {string} props.blockName    The block type name.
 * @param {string} props.clientId     The block client ID.
 * @param {Object} props.blockContext The block context.
 * @return {Element} The binding field badge component.
 */
export default function BindingFieldBadge( {
	fieldId,
	blockName,
	clientId,
	blockContext,
} ) {
	const {
		isBound,
		binding,
		isEditable,
		isValid,
		sourceLabel,
		fieldLabel,
		isBindable,
	} = useBindingState( {
		fieldId,
		blockName,
		clientId,
		blockContext,
	} );

	// Don't render if field is not bindable
	if ( ! isBindable ) {
		return null;
	}

	// Determine icon and label based on state
	let icon;
	let label;
	let className = 'binding-field-badge';

	if ( isBound ) {
		if ( ! isValid ) {
			icon = error;
			label = __( 'Source not registered' );
			className += ' is-invalid';
		} else if ( isEditable ) {
			icon = link;
			label = fieldLabel || sourceLabel || __( 'Connected to source' );
			className += ' is-connected';
		} else {
			icon = lockSmall;
			label = fieldLabel || sourceLabel || __( 'Connected (read-only)' );
			className += ' is-connected is-read-only';
		}
	} else {
		icon = linkOff;
		label = __( 'Connect to source' );
		className += ' binding-field-badge__connect';
	}

	return (
		<div className={ className }>
			<Menu placement="left-start">
				<Menu.TriggerButton
					icon={ icon }
					label={ label }
					size="compact"
					variant="tertiary"
				/>
				<BindingMenu
					fieldId={ fieldId }
					blockName={ blockName }
					clientId={ clientId }
					blockContext={ blockContext }
					binding={ binding }
					placement="left-start"
				/>
			</Menu>
		</div>
	);
}
