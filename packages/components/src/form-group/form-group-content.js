/**
 * External dependencies
 */
import { ui } from '@wp-g2/styles';
import { VStack } from '@wp-g2/components';

/**
 * WordPress dependencies
 */
import { useMemo, memo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { FormGroupContext } from './form-group-context';
import FormGroupHelp from './form-group-help';
import FormGroupLabel from './form-group-label';

/**
 * @typedef OwnProps
 * @property {Pick<import('./form-group-label').Props, 'align'>} [alignLabel] The alignment of the `FormGroupLabel`.
 * @property {import('react').ReactNode} [children] The content to display within `FormGroupContent`.
 * @property {import('react').ReactNode} [help] The help content to display.
 * @property {boolean} [horizontal] Displays the label/content as a horizontal or a vertical stack.
 * @property {boolean} [isLabelBlock = true] Displays the label as a block element.
 * @property {import('react').ReactNode} [label] The label content.
 * @property {import('react').CSSProperties['width']} [spacing = 2] Adjusts the spacing between inner elements.
 * @property {boolean} [truncate] Truncates the `FormGroupLabel` content.
 */

/** @typedef {import('./form-group-label').OwnProps & OwnProps} Props */

/**
 * @param {Props} props
 */
function FormGroupContent( {
	alignLabel,
	children,
	help,
	horizontal,
	id,
	isLabelBlock = true,
	label,
	labelHidden,
	spacing = 2,
	truncate,
} ) {
	const contextProps = useMemo( () => ( { id, horizontal } ), [
		id,
		horizontal,
	] );

	const content = help ? (
		<VStack
			expanded={ false }
			{ ...ui.$( 'FormGroupContentContainer' ) }
			spacing={ spacing }
		>
			{ children }
			<FormGroupHelp>{ help }</FormGroupHelp>
		</VStack>
	) : (
		children
	);

	return (
		<FormGroupContext.Provider value={ contextProps }>
			<FormGroupLabel
				align={ alignLabel }
				id={ id }
				isLabelBlock={ isLabelBlock }
				labelHidden={ labelHidden }
				truncate={ truncate }
			>
				{ label }
			</FormGroupLabel>
			{ content }
		</FormGroupContext.Provider>
	);
}

export default memo( FormGroupContent );
