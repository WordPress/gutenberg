/**
 * External dependencies
 */
import classnames from 'classnames';
import { pick } from 'lodash';

/**
 * WordPress dependencies
 */
import { withFilters, Popover } from '@wordpress/components';
import {
	getBlockDefaultClassName,
	hasBlockSupport,
	getBlockType,
} from '@wordpress/blocks';
import { useContext, useMemo, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockContext from '../block-context';

/**
 * Default value used for blocks which do not define their own context needs,
 * used to guarantee that a block's `context` prop will always be an object. It
 * is assigned as a constant since it is always expected to be an empty object,
 * and in order to avoid unnecessary React reconciliations of a changing object.
 *
 * @type {{}}
 */
const DEFAULT_BLOCK_CONTEXT = {};

function IframeCompat( { children } ) {
	const [ ref, setRef ] = useState();
	const [ height, setHeight ] = useState();

	return (
		<div
			ref={ setRef }
			className="wp-block iframe-compat-placeholder"
			style={ { height, position: 'relative' } }
		>
			{ ref && (
				<Popover
					__unstableSlotName="block-toolbar"
					anchorRef={ ref }
					__unstabelOnHeightChange={ setHeight }
					__unstableSpanOverAnchor
					__unstableTransparent
				>
					{ children }
				</Popover>
			) }
		</div>
	);
}

export const Edit = ( props ) => {
	const { attributes = {}, name } = props;
	const blockType = getBlockType( name );
	const blockContext = useContext( BlockContext );

	// Assign context values using the block type's declared context needs.
	const context = useMemo( () => {
		return blockType && blockType.usesContext
			? pick( blockContext, blockType.usesContext )
			: DEFAULT_BLOCK_CONTEXT;
	}, [ blockType, blockContext ] );

	if ( ! blockType ) {
		return null;
	}

	// `edit` and `save` are functions or components describing the markup
	// with which a block is displayed. If `blockType` is valid, assign
	// them preferentially as the render value for the block.
	const Component = blockType.edit || blockType.save;
	let component;

	if (
		blockType.apiVersion > 1 ||
		hasBlockSupport( blockType, 'lightBlockWrapper', false )
	) {
		component = <Component { ...props } context={ context } />;
	} else {
		// Generate a class name for the block's editable form
		const generatedClassName = hasBlockSupport(
			blockType,
			'className',
			true
		)
			? getBlockDefaultClassName( name )
			: null;
		const className = classnames(
			generatedClassName,
			attributes.className
		);
		component = (
			<Component
				{ ...props }
				context={ context }
				className={ className }
			/>
		);
	}

	if ( ! hasBlockSupport( blockType, 'iframe', true ) ) {
		component = <IframeCompat>{ component }</IframeCompat>;
	}

	return component;
};

export default withFilters( 'editor.BlockEdit' )( Edit );
