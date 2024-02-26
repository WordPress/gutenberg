/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';
import { privateApis as componentsPrivateApis } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { CompositeGroupV2: CompositeGroup } = unlock( componentsPrivateApis );

function InserterListboxRow( props, ref ) {
	return <CompositeGroup role="presentation" ref={ ref } { ...props } />;
}

export default forwardRef( InserterListboxRow );
