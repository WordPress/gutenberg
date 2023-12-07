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
import align from './align';
import './lock';
import anchor from './anchor';
import './aria-label';
import customClassName from './custom-class-name';
import './generated-class-name';
import style from './style';
import './settings';
import './color';
import duotone from './duotone';
import './font-family';
import './font-size';
import './border';
import position from './position';
import layout from './layout';
import './content-lock-ui';
import './metadata';
import customFields from './custom-fields';
import blockHooks from './block-hooks';
import blockRenaming from './block-renaming';

const features = [
	align,
	anchor,
	customClassName,
	style,
	duotone,
	position,
	layout,
	window.__experimentalConnections ? customFields : null,
	blockHooks,
	blockRenaming,
]
	.filter( Boolean )
	.map( ( settings ) => {
		return {
			...settings,
			Edit: pure( settings.edit ),
		};
	} );

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
				( { Edit, hasSupport, attributeKeys = [] }, i ) => {
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
						<Edit
							key={ i }
							name={ props.name }
							clientId={ props.clientId }
							setAttributes={ props.setAttributes }
							__unstableParentLayout={
								props.__unstableParentLayout
							}
							{ ...neededProps }
						/>
					);
				}
			),
			<OriginalBlockEdit key="edit" { ...props } />,
		];
	},
	'withBlockEditHooks'
);

addFilter( 'editor.BlockEdit', 'core/editor/hooks', withBlockEditHooks );
