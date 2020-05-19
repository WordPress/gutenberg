/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	__experimentalGetBlockLabel as getBlockLabel,
	getBlockType,
} from '@wordpress/blocks';
import { Button, Fill, Slot, VisuallyHidden } from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import {
	Children,
	cloneElement,
	forwardRef,
	useContext,
} from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';
import { BlockListBlockContext } from '../block-list/block';
import { useBlockNavigationContext } from './context';

export const BlockNavigationBlockContentWrapper = forwardRef( function(
	{
		as: WrapperComponent,
		className,
		block,
		isSelected,
		onClick,
		position,
		siblingCount,
		level,
		children,
		...props
	},
	ref
) {
	const { name, attributes } = block;
	const instanceId = useInstanceId( BlockNavigationBlockContentWrapper );
	const descriptionId = `block-navigation-block-select-button_${ instanceId }`;
	const blockType = getBlockType( name );
	const blockDisplayName = getBlockLabel( blockType, attributes );
	const blockPositionDescription = sprintf(
		/* translators: 1: The numerical position of the block. 2: The total number of blocks. 3. The level of nesting for the block. */
		__( 'Block %1$d of %2$d, Level %3$d' ),
		position,
		siblingCount,
		level
	);

	return (
		<>
			<WrapperComponent
				className={ classnames(
					'block-editor-block-navigation-block-content-wrapper',
					className
				) }
				onClick={ onClick }
				aria-describedby={ descriptionId }
				ref={ ref }
				{ ...props }
			>
				<BlockIcon icon={ blockType.icon } showColors />
				{ children ? children : blockDisplayName }
				{ isSelected && (
					<VisuallyHidden>
						{ __( '(selected block)' ) }
					</VisuallyHidden>
				) }
			</WrapperComponent>
			<div
				className="block-editor-block-navigation-block-content-wrapper__description"
				id={ descriptionId }
			>
				{ blockPositionDescription }
			</div>
		</>
	);
} );

const BlockNavigationBlockSelectButton = forwardRef( ( props, ref ) => (
	<BlockNavigationBlockContentWrapper
		ref={ ref }
		as={ Button }
		className="block-editor-block-navigation-block-select-button"
		{ ...props }
	/>
) );

const getSlotName = ( clientId ) => `BlockNavigationBlock-${ clientId }`;

const noop = () => null;
const BlockNavigationBlockSlot = forwardRef( ( props, ref ) => {
	const { clientId } = props.block;

	return (
		<Slot name={ getSlotName( clientId ) }>
			{ ( fills ) => {
				if ( ! fills.length ) {
					return (
						<BlockNavigationBlockSelectButton
							ref={ ref }
							{ ...props }
						/>
					);
				}

				return (
					<BlockNavigationBlockContentWrapper
						as="div"
						{ ...props }
						// Fills should implement onClick on their own
						onClick={ noop }
					>
						{ Children.map( fills, ( fill ) =>
							cloneElement( fill, {
								...props,
								...fill.props,
							} )
						) }
					</BlockNavigationBlockContentWrapper>
				);
			} }
		</Slot>
	);
} );

export const BlockNavigationBlockFill = ( props ) => {
	const { clientId } = useContext( BlockListBlockContext );
	return <Fill { ...props } name={ getSlotName( clientId ) } />;
};

const BlockNavigationBlockContents = forwardRef(
	(
		{ onClick, block, isSelected, position, siblingCount, level, ...props },
		ref
	) => {
		const {
			__experimentalWithBlockNavigationSlots: withBlockNavigationSlots,
		} = useBlockNavigationContext();

		return withBlockNavigationSlots ? (
			<BlockNavigationBlockSlot
				ref={ ref }
				block={ block }
				onClick={ onClick }
				isSelected={ isSelected }
				position={ position }
				siblingCount={ siblingCount }
				level={ level }
				{ ...props }
			/>
		) : (
			<BlockNavigationBlockSelectButton
				ref={ ref }
				block={ block }
				onClick={ onClick }
				isSelected={ isSelected }
				position={ position }
				siblingCount={ siblingCount }
				level={ level }
				{ ...props }
			/>
		);
	}
);

export default BlockNavigationBlockContents;
