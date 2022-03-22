/**
 * External dependencies
 */
import classnames from 'classnames';

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

/**
 * Renders a toolbar.
 *
 * To add controls, simply pass `ToolbarButton` components as children.
 *
 * @param {Object} props             Component props.
 * @param {string} [props.className] Class to set on the container div.
 * @param {string} [props.label]     ARIA label for toolbar container.
 * @param {Object} ref               React Element ref.
 */
function Toolbar( { className, label, ...props }, ref ) {
	if ( ! label ) {
		deprecated( 'Using Toolbar without label prop', {
			since: '5.6',
			alternative: 'ToolbarGroup component',
			link:
				'https://developer.wordpress.org/block-editor/components/toolbar/',
		} );
		return <ToolbarGroup { ...props } className={ className } />;
	}
	// `ToolbarGroup` already uses components-toolbar for compatibility reasons.
	const finalClassName = classnames(
		'components-accessible-toolbar',
		className
	);
	return (
		<ToolbarContainer
			className={ finalClassName }
			label={ label }
			ref={ ref }
			{ ...props }
		/>
	);
}

export default forwardRef( Toolbar );
