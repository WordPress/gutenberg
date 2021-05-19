/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

const PanelRow = forwardRef( ( { className, children }, ref ) => (
	<div
		className={ classnames( 'components-panel__row', className ) }
		ref={ ref }
	>
		{ children }
	</div>
) );

export default PanelRow;
