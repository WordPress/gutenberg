/**
 * External dependencies
 */
import { find } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Toolbar } from '@wordpress/components';
import { withViewportMatch } from '@wordpress/viewport';
import { withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { withBlockEditContext } from '../block-edit/context';

const ALIGNMENT_CONTROLS = [
	{
		icon: 'editor-alignleft',
		title: __( 'Align left' ),
		align: 'left',
	},
	{
		icon: 'editor-aligncenter',
		title: __( 'Align center' ),
		align: 'center',
	},
	{
		icon: 'editor-alignright',
		title: __( 'Align right' ),
		align: 'right',
	},
];

export function AlignmentToolbar( { isCollapsed, value, onChange } ) {
	function applyOrUnset( align ) {
		return () => onChange( value === align ? undefined : align );
	}

	const activeAlignment = find( ALIGNMENT_CONTROLS, ( control ) => control.align === value );

	return (
		<Toolbar
			isCollapsed={ isCollapsed }
			icon={ activeAlignment ? activeAlignment.icon : 'editor-alignleft' }
			label={ __( 'Change Text Alignment' ) }
			controls={ ALIGNMENT_CONTROLS.map( ( control ) => {
				const { align } = control;
				const isActive = ( value === align );

				return {
					...control,
					isActive,
					onClick: applyOrUnset( align ),
				};
			} ) }
		/>
	);
}

export default compose(
	withBlockEditContext( ( { clientId } ) => {
		return {
			clientId,
		};
	} ),
	withViewportMatch( { isLargeViewport: 'medium' } ),
	withSelect( ( select, { clientId, isLargeViewport, isCollapsed } ) => {
		const { getBlockRootClientId, getEditorSettings } = select( 'core/editor' );
		return {
			isCollapsed: isCollapsed || ! isLargeViewport || (
				! getEditorSettings().hasFixedToolbar &&
				getBlockRootClientId( clientId )
			),
		};
	} ),
)( AlignmentToolbar );
