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

const getBlockPositionDescription = ( position, siblingCount, level ) =>
	sprintf(
		/* translators: 1: The numerical position of the block. 2: The total number of blocks. 3. The level of nesting for the block. */
		__( 'Block %1$d of %2$d, Level %3$d' ),
		position,
		siblingCount,
		level
	);

const BlockNavigationBlockSelectButton = forwardRef( function(
	{
		block,
		isSelected,
		onClick,
		position,
		siblingCount,
		level,
		tabIndex,
		onFocus,
	},
	ref
) {
	const { name, attributes } = block;

	const blockType = getBlockType( name );
	const blockDisplayName = getBlockLabel( blockType, attributes );

	const instanceId = useInstanceId( BlockNavigationBlockSelectButton );
	const descriptionId = `block-navigation-block-select-button__${ instanceId }`;
	const blockPositionDescription = getBlockPositionDescription(
		position,
		siblingCount,
		level
	);

	return (
		<>
			<Button
				className={ classnames(
					'block-editor-block-navigation-block-select-button',
					'block-editor-block-navigation-block-contents'
				) }
				onClick={ onClick }
				aria-describedby={ descriptionId }
				ref={ ref }
				tabIndex={ tabIndex }
				onFocus={ onFocus }
			>
				<BlockIcon icon={ blockType.icon } showColors />
				{ blockDisplayName }
				{ isSelected && (
					<VisuallyHidden>
						{ __( '(selected block)' ) }
					</VisuallyHidden>
				) }
			</Button>
			<div
				className="block-editor-block-navigation-block-contents__description"
				id={ descriptionId }
			>
				{ blockPositionDescription }
			</div>
		</>
	);
} );

const BlockNavigationBlockSlot = forwardRef( function( props, ref ) {
	const instanceId = useInstanceId( BlockNavigationBlockSlot );
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

				const {
					block,
					isSelected,
					position,
					siblingCount,
					level,
					tabIndex,
					onFocus,
				} = props;

				const { name } = block;
				const blockType = getBlockType( name );

				const descriptionId = `block-navigation-block-slot__${ instanceId }`;
				const blockPositionDescription = getBlockPositionDescription(
					position,
					siblingCount,
					level
				);

				const forwardedFillProps = {
					// Ensure that the component in the slot can receive
					// keyboard navigation.
					tabIndex,
					onFocus,
					ref,
					// Give the element rendered in the slot a description
					// that describes its position.
					'aria-describedby': descriptionId,
				};

				return (
					<>
						<div
							className={ classnames(
								'block-editor-block-navigation-block-slot',
								'block-editor-block-navigation-block-contents'
							) }
						>
							<BlockIcon icon={ blockType.icon } showColors />
							{ Children.map( fills, ( fill ) =>
								cloneElement( fill, {
									...fill.props,
									...forwardedFillProps,
								} )
							) }
							{ isSelected && (
								<VisuallyHidden>
									{ __( '(selected block)' ) }
								</VisuallyHidden>
							) }
							<div
								className="block-editor-block-navigation-block-contents__description"
								id={ descriptionId }
							>
								{ blockPositionDescription }
							</div>
						</div>
					</>
				);
			} }
		</Slot>
	);
} );

const getSlotName = ( clientId ) => `BlockNavigationBlock-${ clientId }`;

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
