/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

const PanelRow = ( { className, children }, ref ) => (
	<div
		className={ classnames( 'components-panel__row', className ) }
		ref={ ref }
	>
		{ children }
	</div>
);

export default forwardRef( PanelRow );
