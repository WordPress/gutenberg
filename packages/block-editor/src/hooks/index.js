/**
 * WordPress dependencies
 */
import { createHigherOrderComponent, pure } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import useDisplayBlockControls from '../components/use-display-block-controls';
import './compat';
import './lock';
import './anchor';
import './aria-label';
import './custom-class-name';
import './generated-class-name';
import './style';
import './settings';
import './color';
import './font-family';
import './font-size';
import './border';
import './position';
import './content-lock-ui';
import './metadata';
import './custom-fields';
import './block-hooks';
import './block-renaming';

const features = [ 'layout', 'duotone', 'align', 'anchor' ].map(
	( feature ) => {
		const settings = require( `./${ feature }` );
		return {
			...settings,
			name: feature,
			BlockEdit: pure( settings.BlockEdit ),
		};
	}
);

export { useCustomSides } from './dimensions';
export { useLayoutClasses, useLayoutStyles } from './layout';
export { getBorderClassesAndStyles, useBorderProps } from './use-border-props';
export { getColorClassesAndStyles, useColorProps } from './use-color-props';
export { getSpacingClassesAndStyles } from './use-spacing-props';
export { getTypographyClassesAndStyles } from './use-typography-props';
export { getGapCSSValue } from './gap';
export { useCachedTruthy } from './use-cached-truthy';

export const withBlockEditHooks = createHigherOrderComponent(
	( OriginalBlockEdit ) => ( props ) => {
		const shouldDisplayControls = useDisplayBlockControls();
		return [
			...features.map(
				( { name, BlockEdit, hasSupport, attributeKeys } ) => {
					if (
						! shouldDisplayControls ||
						! hasSupport( props.name )
					) {
						return null;
					}
					const neededProps = {};
					for ( const key of attributeKeys ) {
						if ( props.attributes[ key ] ) {
							neededProps[ key ] = props.attributes[ key ];
						}
					}
					return (
						<BlockEdit
							key={ name }
							name={ props.name }
							setAttributes={ props.setAttributes }
							{ ...neededProps }
						/>
					);
				}
			),
			<OriginalBlockEdit key="edit" { ...props } />,
		];
	},
	'withLayoutControls'
);

addFilter( 'editor.BlockEdit', 'core/editor/hooks', withBlockEditHooks );
