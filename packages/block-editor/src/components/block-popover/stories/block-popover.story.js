/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { ToolbarGroup, ToolbarButton, Popover } from '@wordpress/components';
import {
	formatBold,
	formatItalic,
	moreHorizontal,
	chevronUp,
	chevronDown,
	copy,
	trash,
} from '@wordpress/icons';

export default {
	title: 'BlockEditor/BlockPopover',
	component: Popover,
	parameters: {
		docs: {
			description: {
				component:
					'`BlockPopover` is a wrapper around the `Popover` component that appears when a block is selected. It is used to display block-level controls such as toolbars or settings, positioning itself relative to the block while rendering outside the editor canvas to avoid layout conflicts.',
			},
		},
	},
	decorators: [
		( Story ) => (
			<>
				<Popover.Slot />
				<Story />
			</>
		),
	],
};

export const Default = () => {
	const [ selectedBlockId, setSelectedBlockId ] = useState( null );
	const [ anchorElement, setAnchorElement ] = useState( null );
	const [ blocks, setBlocks ] = useState( [
		{
			id: 'block-1',
			type: 'paragraph',
			content:
				'This is the first paragraph block. Click to select it and see the block toolbar.',
			isBold: false,
			isItalic: false,
		},
		{
			id: 'block-2',
			type: 'heading',
			content: 'This is a heading block.',
			isBold: false,
			isItalic: false,
		},
		{
			id: 'block-3',
			type: 'paragraph',
			content:
				'This is another paragraph block with some longer content to demonstrate how the block toolbar positions itself.',
			isBold: false,
			isItalic: false,
		},
	] );
	const [ actionFeedback, setActionFeedback ] = useState( '' );

	const handleBlockClick = ( blockId, element ) => {
		setSelectedBlockId( blockId );
		setAnchorElement( element );
		setActionFeedback( '' );
	};

	const handleDeselect = () => {
		setSelectedBlockId( null );
		setAnchorElement( null );
		setActionFeedback( '' );
	};

	const showFeedback = ( message ) => {
		setActionFeedback( message );
		setTimeout( () => setActionFeedback( '' ), 2000 );
	};

	const handleBlockAction = ( action ) => {
		const selectedBlock = blocks.find(
			( block ) => block.id === selectedBlockId
		);

		switch ( action ) {
			case 'Bold':
				setBlocks(
					blocks.map( ( block ) =>
						block.id === selectedBlockId
							? { ...block, isBold: ! block.isBold }
							: block
					)
				);
				showFeedback(
					`Bold ${ selectedBlock?.isBold ? 'removed' : 'applied' }`
				);
				break;
			case 'Italic':
				setBlocks(
					blocks.map( ( block ) =>
						block.id === selectedBlockId
							? { ...block, isItalic: ! block.isItalic }
							: block
					)
				);
				showFeedback(
					`Italic ${
						selectedBlock?.isItalic ? 'removed' : 'applied'
					}`
				);
				break;
			case 'MoveUp':
				const currentIndexUp = blocks.findIndex(
					( block ) => block.id === selectedBlockId
				);
				if ( currentIndexUp > 0 ) {
					const newBlocks = [ ...blocks ];
					[
						newBlocks[ currentIndexUp ],
						newBlocks[ currentIndexUp - 1 ],
					] = [
						newBlocks[ currentIndexUp - 1 ],
						newBlocks[ currentIndexUp ],
					];
					setBlocks( newBlocks );
					showFeedback( 'Block moved up' );
				} else {
					showFeedback( 'Block is already at the top' );
				}
				break;
			case 'MoveDown':
				const currentIndexDown = blocks.findIndex(
					( block ) => block.id === selectedBlockId
				);
				if ( currentIndexDown < blocks.length - 1 ) {
					const newBlocks = [ ...blocks ];
					[
						newBlocks[ currentIndexDown ],
						newBlocks[ currentIndexDown + 1 ],
					] = [
						newBlocks[ currentIndexDown + 1 ],
						newBlocks[ currentIndexDown ],
					];
					setBlocks( newBlocks );
					showFeedback( 'Block moved down' );
				} else {
					showFeedback( 'Block is already at the bottom' );
				}
				break;
			case 'Duplicate':
				const blockToCopy = blocks.find(
					( block ) => block.id === selectedBlockId
				);
				if ( blockToCopy ) {
					const newBlock = {
						...blockToCopy,
						id: `${ blockToCopy.id }-copy-${ Date.now() }`,
						content: `${ blockToCopy.content } (Copy)`,
					};
					const insertIndex =
						blocks.findIndex(
							( block ) => block.id === selectedBlockId
						) + 1;
					const newBlocks = [ ...blocks ];
					newBlocks.splice( insertIndex, 0, newBlock );
					setBlocks( newBlocks );
					showFeedback( 'Block duplicated' );
				}
				break;
			case 'Remove':
				setBlocks(
					blocks.filter( ( block ) => block.id !== selectedBlockId )
				);
				setSelectedBlockId( null );
				setAnchorElement( null );
				showFeedback( 'Block removed' );
				break;
			case 'More options':
				showFeedback( 'More options menu would open here' );
				break;
			default:
				showFeedback( `${ action } clicked` );
		}
	};

	return (
		<div style={ { padding: '10px', fontFamily: 'system-ui, sans-serif' } }>
			<p style={ { color: '#666', marginBottom: '30px' } }>
				Click on any block below to select it and see the block toolbar
				appear above it.
			</p>

			{ /* Block Editor Canvas */ }
			<div
				style={ {
					border: '1px solid #ddd',
					borderRadius: '4px',
					padding: '20px',
					minHeight: '200px',
					background: '#fff',
					position: 'relative',
				} }
				onClick={ handleDeselect }
				onKeyDown={ ( e ) => {
					if ( e.key === 'Escape' ) {
						handleDeselect();
					}
				} }
				role="button"
				tabIndex={ 0 }
			>
				{ blocks.map( ( block ) => {
					return (
						<div
							key={ block.id }
							id={ block.id }
							onClick={ ( e ) => {
								e.stopPropagation();
								handleBlockClick( block.id, e.currentTarget );
							} }
							onKeyDown={ ( e ) => {
								if ( e.key === 'Enter' || e.key === ' ' ) {
									e.preventDefault();
									e.stopPropagation();
									handleBlockClick(
										block.id,
										e.currentTarget
									);
								}
							} }
							role="button"
							tabIndex={ 0 }
							aria-label={ `Select block: ${ block.content.substring(
								0,
								50
							) }${ block.content.length > 50 ? '...' : '' }` }
							style={ {
								margin: '16px 0',
								padding: '12px',
								border:
									selectedBlockId === block.id
										? '2px solid #007cba'
										: '1px solid transparent',
								borderRadius: '4px',
								cursor: 'pointer',
								outline:
									selectedBlockId === block.id
										? '1px solid #007cba'
										: 'none',
								outlineOffset: '2px',
								transition: 'all 0.15s ease',
								fontWeight: block.isBold ? 'bold' : 'normal',
								fontStyle: block.isItalic ? 'italic' : 'normal',
							} }
						>
							{ block.type === 'heading' ? (
								<h2
									style={ {
										margin: 0,
										fontSize: '1.5em',
										fontWeight: block.isBold
											? 'bold'
											: 'normal',
										fontStyle: block.isItalic
											? 'italic'
											: 'normal',
									} }
								>
									{ block.content }
								</h2>
							) : (
								<p
									style={ {
										margin: 0,
										lineHeight: '1.5',
										fontWeight: block.isBold
											? 'bold'
											: 'normal',
										fontStyle: block.isItalic
											? 'italic'
											: 'normal',
									} }
								>
									{ block.content }
								</p>
							) }
						</div>
					);
				} ) }
			</div>

			{ /* Block Toolbar */ }
			{ selectedBlockId && anchorElement && (
				<Popover
					anchor={ anchorElement }
					placement="top"
					offset={ 10 }
					focusOnMount={ false }
					__unstableSlotName="block-toolbar"
				>
					<div
						style={ {
							background: 'white',
							borderRadius: '6px',
							padding: '6px',
							display: 'flex',
							alignItems: 'center',
							gap: '2px',
							fontSize: '14px',
						} }
					>
						{ /* Text Formatting Group */ }
						<ToolbarGroup>
							<ToolbarButton
								icon={ formatBold }
								label="Bold"
								onClick={ () => handleBlockAction( 'Bold' ) }
								size="compact"
								isPressed={
									blocks.find(
										( b ) => b.id === selectedBlockId
									)?.isBold || false
								}
							/>
							<ToolbarButton
								icon={ formatItalic }
								label="Italic"
								onClick={ () => handleBlockAction( 'Italic' ) }
								size="compact"
								isPressed={
									blocks.find(
										( b ) => b.id === selectedBlockId
									)?.isItalic || false
								}
							/>
						</ToolbarGroup>

						{ /* Separator */ }
						<div
							style={ {
								width: '1px',
								height: '20px',
								background: '#e0e0e0',
								margin: '0 4px',
							} }
						/>

						{ /* Block Movement Group */ }
						<ToolbarGroup>
							<ToolbarButton
								icon={ chevronUp }
								label="Move block up"
								onClick={ () => handleBlockAction( 'MoveUp' ) }
								size="compact"
								disabled={
									blocks.findIndex(
										( b ) => b.id === selectedBlockId
									) === 0
								}
							/>
							<ToolbarButton
								icon={ chevronDown }
								label="Move block down"
								onClick={ () =>
									handleBlockAction( 'MoveDown' )
								}
								size="compact"
								disabled={
									blocks.findIndex(
										( b ) => b.id === selectedBlockId
									) ===
									blocks.length - 1
								}
							/>
						</ToolbarGroup>

						{ /* Separator */ }
						<div
							style={ {
								width: '1px',
								height: '20px',
								background: '#e0e0e0',
								margin: '0 4px',
							} }
						/>

						{ /* Block Actions Group */ }
						<ToolbarGroup>
							<ToolbarButton
								icon={ copy }
								label="Duplicate block"
								onClick={ () =>
									handleBlockAction( 'Duplicate' )
								}
								size="compact"
							/>
							<ToolbarButton
								icon={ trash }
								label="Remove block"
								onClick={ () => handleBlockAction( 'Remove' ) }
								size="compact"
							/>
						</ToolbarGroup>

						{ /* Separator */ }
						<div
							style={ {
								width: '1px',
								height: '20px',
								background: '#e0e0e0',
								margin: '0 4px',
							} }
						/>

						{ /* More Options */ }
						<ToolbarButton
							icon={ moreHorizontal }
							label="More options"
							onClick={ () =>
								handleBlockAction( 'More options' )
							}
							size="compact"
						/>
					</div>
				</Popover>
			) }

			{ /* Action Feedback */ }
			{ actionFeedback && (
				<div
					style={ {
						position: 'fixed',
						top: '20px',
						right: '20px',
						background: '#007cba',
						color: 'white',
						padding: '12px 16px',
						borderRadius: '4px',
						boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
						fontSize: '14px',
						fontWeight: '500',
						zIndex: 1000,
					} }
				>
					{ actionFeedback }
				</div>
			) }
		</div>
	);
};
