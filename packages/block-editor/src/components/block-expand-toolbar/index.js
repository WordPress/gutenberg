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

/**
 * Expand controls array.
 *
 * @type {{screen: {icon: string, title: string}}}
 */
const BLOCK_EXPAND_CONTROLS = {
	screen: {
		icon: 'align-wide',
		title: __( 'Expand to viewport' ),
	},
};

/**
 * Default controls.
 * It's possible to define which controls
 * will be shown in the Toolbar.
 */
const DEFAULT_CONTROLS = [ 'screen' ];

export function BlockExpandToolbar( { isCollapsed, value, onChange, controls = DEFAULT_CONTROLS } ) {
	function applyOrUnset( expand ) {
		return () => onChange( value === expand ? undefined : expand );
	}

	const activeAlignment = BLOCK_EXPAND_CONTROLS[ value ];

	return (
		<Toolbar
			isCollapsed={ isCollapsed }
			icon={ activeAlignment ? activeAlignment.icon : BLOCK_EXPAND_CONTROLS.screen.icon }
			label={ __( 'Change expansibility' ) }
			className="block-editor-block-expand-toolbar"
			controls={
				controls.map( ( control ) => {
					return {
						...BLOCK_EXPAND_CONTROLS[ control ],
						isActive: value === control,
						onClick: applyOrUnset( control ),
					};
				} )
			}
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
		const { getBlockRootClientId, getSettings } = select( 'core/block-editor' );
		const settings = getSettings();

		return {
			isCollapsed: isCollapsed || ! isLargeViewport || (
				! settings.hasFixedToolbar &&
				getBlockRootClientId( clientId )
			),
		};
	} ),
)( BlockExpandToolbar );
