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

const DEFAULT_ALIGNMENT_CONTROLS = [
	{
		icon: 'editor-alignleft',
		title: __( 'Align text left' ),
		align: 'left',
	},
	{
		icon: 'editor-aligncenter',
		title: __( 'Align text center' ),
		align: 'center',
	},
	{
		icon: 'editor-alignright',
		title: __( 'Align text right' ),
		align: 'right',
	},
];

export function AlignmentToolbar( {
	alignmentControls = DEFAULT_ALIGNMENT_CONTROLS,
	customAlignmentTypes,
	isCollapsed,
	onChange,
	value,
} ) {
	function applyOrUnset( align ) {
		return () => onChange( value === align ? undefined : align );
	}

	const extendedAlignmentControls = [
		...alignmentControls,
		...customAlignmentTypes,
	];

	const activeAlignment = find( extendedAlignmentControls, ( control ) => control.align === value );

	return (
		<Toolbar
			isCollapsed={ isCollapsed }
			icon={ activeAlignment ? activeAlignment.icon : 'editor-alignleft' }
			label={ __( 'Change Text Alignment' ) }
			controls={ extendedAlignmentControls.map( ( control ) => {
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
		const { getSelectedBlock, getBlockRootClientId, getSettings } = select( 'core/block-editor' );
		const { getCustomAlignmentTypesForBlock } = select( 'core/rich-text' );

		const selectedBlock = getSelectedBlock();
		const customAlignmentTypes = selectedBlock ?
			getCustomAlignmentTypesForBlock( selectedBlock.name ) :
			[];

		return {
			isCollapsed: isCollapsed || ! isLargeViewport || (
				! getSettings().hasFixedToolbar &&
				getBlockRootClientId( clientId )
			),
			customAlignmentTypes,
		};
	} ),
)( AlignmentToolbar );
