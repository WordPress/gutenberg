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
 * @param {import('@wp-g2/create-styles').ViewOwnProps<import('./types').FormGroupContentProps, 'label'>} props
 */
function FormGroupContent( {
	alignLabel,
	children,
	help,
	horizontal = false,
	id,
	label,
	labelHidden,
	spacing = 2,
	truncate,
	...props
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
				labelHidden={ labelHidden }
				truncate={ truncate }
				{ ...props }
			>
				{ label }
			</FormGroupLabel>
			{ content }
		</FormGroupContext.Provider>
	);
}

export default memo( FormGroupContent );
