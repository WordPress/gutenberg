import { memo } from '@wordpress/element';
import {
	mayDisplayControlsKey,
	mayDisplayParentControlsKey,
	mayDisplayPatternEditingControlsKey,
} from './context';
import type { BlockEditContextValue, BlockEditPublicProps } from './types';
import type { BlockEditFeature } from '../../hooks/types';

let blockEditFeatures: Array<
	BlockEditFeature & { Edit: BlockEditFeature[ 'edit' ] }
> = [];

export function setBlockEditFeatures( features: BlockEditFeature[] ) {
	// We don't want block controls to re-render when typing inside a block.
	// `memo` will prevent re-renders unless props change, so only pass the
	// needed props and not the whole attributes object.
	blockEditFeatures = features.map( ( settings ) => {
		return { ...settings, Edit: memo( settings.edit ) };
	} );
}

/**
 * Renders the block supports of a block next to its edit component, rather
 * than as a filter around every block: most blocks render none of them.
 *
 * @param props   The props of the block's edit component.
 * @param context The block edit context.
 *
 * @return The features to render.
 */
export function renderBlockEditFeatures(
	props: BlockEditPublicProps,
	context: BlockEditContextValue
) {
	return blockEditFeatures.map( ( feature, i ) => {
		const {
			Edit,
			hasSupport,
			attributeKeys = [],
			shareWithChildBlocks,
			supportsPatternEditing,
			isActive,
		} = feature;
		// Explicit `false` hides the feature during pattern editing,
		// even when the block is selected.
		if (
			context[ mayDisplayPatternEditingControlsKey ] &&
			supportsPatternEditing === false
		) {
			return null;
		}

		const shouldDisplayControls =
			// Explicit `true` also shows controls for unselected blocks
			// in the section. `undefined` uses the selection/parent rules.
			( supportsPatternEditing === true &&
				context[ mayDisplayPatternEditingControlsKey ] ) ||
			context[ mayDisplayControlsKey ] ||
			( context[ mayDisplayParentControlsKey ] && shareWithChildBlocks );

		if ( ! shouldDisplayControls && ! isActive ) {
			return null;
		}

		if ( ! hasSupport( props.name ) ) {
			return null;
		}

		const neededProps: Record< string, unknown > = {};
		for ( const key of attributeKeys ) {
			if ( props.attributes?.[ key ] ) {
				neededProps[ key ] = props.attributes[ key ];
			}
		}

		if ( ! shouldDisplayControls && ! isActive!( neededProps ) ) {
			return null;
		}

		return (
			<Edit
				// We can use the index because the array length
				// is fixed per page load right now.
				key={ i }
				name={ props.name }
				isSelected={ props.isSelected }
				// Blocks in a block list have a client ID and can be edited.
				clientId={ props.clientId! }
				setAttributes={ props.setAttributes! }
				__unstableParentLayout={ props.__unstableParentLayout }
				// This component is pure, so only pass needed
				// props!!!
				{ ...neededProps }
			/>
		);
	} );
}
