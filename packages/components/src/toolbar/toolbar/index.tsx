/**
 * External dependencies
 */
import classnames from 'classnames';
import type { ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import ToolbarGroup from '../toolbar-group';
import ToolbarContainer from './toolbar-container';
import type { ToolbarProps } from './types';
import {
	WordPressComponentProps,
	ContextSystemProvider,
} from '../../ui/context';

// TODO:
// - (optional) make the legacy `DropdownMenu` read the context variable
// - swap the legacy `DropdownMenu` with the new version of the component
//   once it's stable
const CONTEXT_SYSTEM_VALUE = {
	DropdownMenu: {
		// Note: the legacy `DropdownMenu` component is not yet reactive to this
		// context variant. See https://github.com/WordPress/gutenberg/pull/51097.
		variant: 'toolbar',
	},
};

function UnforwardedToolbar(
	{
		className,
		label,
		...props
	}: WordPressComponentProps< ToolbarProps, 'div', false >,
	ref: ForwardedRef< any >
) {
	if ( ! label ) {
		deprecated( 'Using Toolbar without label prop', {
			since: '5.6',
			alternative: 'ToolbarGroup component',
			link: 'https://developer.wordpress.org/block-editor/components/toolbar/',
		} );
		return <ToolbarGroup { ...props } className={ className } />;
	}
	// `ToolbarGroup` already uses components-toolbar for compatibility reasons.
	const finalClassName = classnames(
		'components-accessible-toolbar',
		className
	);
	return (
		<ContextSystemProvider value={ CONTEXT_SYSTEM_VALUE }>
			<ToolbarContainer
				className={ finalClassName }
				label={ label }
				ref={ ref }
				{ ...props }
			/>
		</ContextSystemProvider>
	);
}

/**
 * Renders a toolbar.
 *
 * To add controls, simply pass `ToolbarButton` components as children.
 *
 * ```jsx
 * import { Toolbar, ToolbarButton } from '@wordpress/components';
 * import { formatBold, formatItalic, link } from '@wordpress/icons';
 *
 * function MyToolbar() {
 *   return (
 *     <Toolbar label="Options">
 *       <ToolbarButton icon={ formatBold } label="Bold" />
 *       <ToolbarButton icon={ formatItalic } label="Italic" />
 *       <ToolbarButton icon={ link } label="Link" />
 *     </Toolbar>
 *   );
 * }
 * ```
 */
export const Toolbar = forwardRef( UnforwardedToolbar );
export default Toolbar;
