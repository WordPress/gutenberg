/**
 * External dependencies
 */
import { identity } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	MenuItem,
	MenuGroup,
	ToolbarButton,
	ToolbarGroup,
} from '@wordpress/components';
import { Children, cloneElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockControls from '../block-controls';
import BlockNavigationEllipsisMenu from '../block-navigation/ellipsis-menu';

export const UniversalBlockControls = ( { children } ) => {
	return (
		<>
			{ withoutChildren( children, 'UniversalControlsGroup' ) }
			<BlockControls>
				{ withChildren( children, 'UniversalControlsGroup', ( child ) =>
					cloneElement( child, { as: ToolbarGroup } )
				) }
			</BlockControls>
			<BlockNavigationEllipsisMenu>
				{ withChildren( children, 'UniversalControlsGroup', ( child ) =>
					cloneElement( child, { as: MenuGroup } )
				) }
			</BlockNavigationEllipsisMenu>
		</>
	);
};

export const UniversalControlsGroup = ( { children, as: Component } ) => {
	const ChildComponent =
		Component === ToolbarGroup ? ToolbarButton : MenuItem;
	return (
		<Component>
			{ withoutChildren( children, 'UniversalControlsButton' ) }
			{ withChildren( children, 'UniversalControlsButton', ( child ) =>
				cloneElement( child, { as: ChildComponent } )
			) }
		</Component>
	);
};

UniversalControlsGroup.displayName = 'UniversalControlsGroup';

export const UniversalControlsButton = ( {
	name,
	icon,
	title,
	shortcut,
	onClick,
	as: Component,
} ) => {
	if ( Component === ToolbarButton ) {
		return (
			<ToolbarButton
				name={ name }
				icon={ icon }
				title={ title }
				shortcut={ shortcut }
				onClick={ onClick }
			/>
		);
	}
	if ( Component === MenuItem ) {
		return (
			<MenuItem shortcut={ shortcut } onClick={ onClick }>
				{ title }
			</MenuItem>
		);
	}
	throw new Error(
		'Unsupported component passed to UniversalControlsButton: ' +
			Component.displayName
	);
};

UniversalControlsButton.displayName = 'UniversalControlsButton';

export default UniversalBlockControls;

const withChildren = ( children, displayName, callback = identity ) =>
	Children.map( children, ( child ) =>
		child.type.displayName === displayName ? callback( child ) : false
	);

const withoutChildren = ( children, displayName, callback = identity ) =>
	Children.map( children, ( child ) =>
		child.type.displayName !== displayName ? callback( child ) : false
	);
