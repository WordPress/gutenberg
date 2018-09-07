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

function AlignmentToolbar( { isCollapsed, isLargeViewport, value, onChange } ) {
	function applyOrUnset( align ) {
		return () => onChange( value === align ? undefined : align );
	}

	const activeAlignment = find( ALIGNMENT_CONTROLS, ( control ) => control.align === value );

	return (
		<Toolbar
			isCollapsed={ isCollapsed || ! isLargeViewport }
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

export default withViewportMatch( { isLargeViewport: 'medium' } )( AlignmentToolbar );
