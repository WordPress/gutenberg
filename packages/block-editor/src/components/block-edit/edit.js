/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { withFilters } from '@wordpress/components';
import {
	getBlockDefaultClassName,
	hasBlockSupport,
	getBlockType,
} from '@wordpress/blocks';
import { useContext, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import ServerSideRender from '@wordpress/server-side-render';
import { useResizeObserver } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BlockContext from '../block-context';
import { useSelect } from '@wordpress/data';
import { store } from '../../store';
import {
	useBlockProps,
	DisableBlockProps,
} from '../block-list/use-block-props';
import Warning from '../warning';
import BlockPopover from '../block-popover';

/**
 * Default value used for blocks which do not define their own context needs,
 * used to guarantee that a block's `context` prop will always be an object. It
 * is assigned as a constant since it is always expected to be an empty object,
 * and in order to avoid unnecessary React reconciliations of a changing object.
 *
 * @type {{}}
 */
const DEFAULT_BLOCK_CONTEXT = {};

function LoadingResponsePlaceholder() {
	return <Warning>{ __( 'Loading preview…' ) }</Warning>;
}

function IframeCompat( {
	clientId,
	blockType,
	attributes,
	isSelected,
	children,
} ) {
	const isIframeIncompatible = useSelect(
		( select ) => select( store ).isIframeIncompatible( clientId ),
		[ clientId ]
	);
	const [ resizeListener, sizes ] = useResizeObserver();
	const blockProps = useBlockProps( {
		style: {
			height: isSelected ? sizes?.height : undefined,
		},
	} );

	if ( ! isIframeIncompatible ) {
		return children;
	}

	return (
		<div { ...blockProps }>
			{ isSelected && (
				<BlockPopover
					clientId={ clientId }
					__unstablePopoverSlot="Popover"
					placement="overlay"
				>
					<DisableBlockProps.Provider value={ true }>
						<div style={ { position: 'relative' } }>
							{ resizeListener }
							{ children }
						</div>
					</DisableBlockProps.Provider>
				</BlockPopover>
			) }
			{ ! isSelected && (
				<ServerSideRender
					block={ blockType.name }
					attributes={ attributes }
					LoadingResponsePlaceholder={ LoadingResponsePlaceholder }
				/>
			) }
		</div>
	);
}

export const Edit = ( props ) => {
	const { attributes = {}, name, clientId, isSelected } = props;
	const blockType = getBlockType( name );
	const blockContext = useContext( BlockContext );

	// Assign context values using the block type's declared context needs.
	const context = useMemo( () => {
		return blockType && blockType.usesContext
			? Object.fromEntries(
					Object.entries( blockContext ).filter( ( [ key ] ) =>
						blockType.usesContext.includes( key )
					)
			  )
			: DEFAULT_BLOCK_CONTEXT;
	}, [ blockType, blockContext ] );

	if ( ! blockType ) {
		return null;
	}

	// `edit` and `save` are functions or components describing the markup
	// with which a block is displayed. If `blockType` is valid, assign
	// them preferentially as the render value for the block.
	const Component = blockType.edit || blockType.save;

	if ( blockType.apiVersion > 1 ) {
		return (
			<IframeCompat
				clientId={ clientId }
				blockType={ blockType }
				attributes={ attributes }
				isSelected={ isSelected }
			>
				<Component { ...props } context={ context } />
			</IframeCompat>
		);
	}

	// Generate a class name for the block's editable form.
	const generatedClassName = hasBlockSupport( blockType, 'className', true )
		? getBlockDefaultClassName( name )
		: null;
	const className = classnames(
		generatedClassName,
		attributes.className,
		props.className
	);

	return (
		<IframeCompat
			clientId={ clientId }
			blockType={ blockType }
			attributes={ attributes }
			isSelected={ isSelected }
		>
			<Component
				{ ...props }
				context={ context }
				className={ className }
			/>
		</IframeCompat>
	);
};

export default withFilters( 'editor.BlockEdit' )( Edit );
