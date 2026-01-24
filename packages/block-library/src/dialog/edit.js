/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useRef, useMemo } from '@wordpress/element';
import {
	BlockControls,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';

/**
 * Internal dependencies
 */
const TEMPLATE = [
	[
		'core/dialog-trigger',
		{
			lock: {
				move: true,
				remove: false,
			},
		},
		[
			[
				'core/paragraph',
				{
					placeholder: __(
						'Start typing to add Dialog trigger text…'
					),
				},
			],
		],
	],
	[
		'core/dialog-element',
		{
			dialogType: 'modal',
			lock: {
				move: true,
				remove: true,
			},
		},
		[
			[
				'core/heading',
				{
					level: 2,
					placeholder: __( 'Add a dialog label…' ),
					metadata: {
						bindings: {
							content: {
								source: 'core/dialog-element-label',
							},
						},
					},
				},
			],
		],
	],
];

export default function Edit( { attributes, setAttributes, clientId } ) {
	// add dialog id attribute to the block
	const { dialogId } = attributes;
	if ( ! dialogId ) {
		setAttributes( { dialogId: clientId } );
	}
	// Set up a ref so that we can query for the dialog element and memoize it.
	const ref = useRef( null );
	// @TODO: This is not... great, but we need to wait for the ref to be populated before we can query for the dialog element. We should look at using a more robust solution for this in the future, perhaps a redux store.
	const dialogElm = useMemo( () => {
		return ref.current?.querySelector( '.wp-block-dialog-element' ) || null;
	}, [ ref ] );

	const blockProps = useBlockProps( {
		ref,
	} );

	// We're locking down the template and allowed blocks to only allow the dialog trigger and dialog element.
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: TEMPLATE,
		templateLock: 'insert',
	} );

	const buttonLabel = useMemo(
		() => ( dialogElm?.open ? __( 'Close Dialog' ) : __( 'Edit Dialog' ) ),
		[ dialogElm ]
	);

	return (
		<>
			<BlockControls __experimentalShareWithChildBlocks>
				<ToolbarGroup>
					<ToolbarButton
						label={ buttonLabel }
						onClick={ () => {
							if ( ! dialogElm ) {
								return;
							}
							dialogElm.showModal();
						} }
					>
						{ buttonLabel }
					</ToolbarButton>
				</ToolbarGroup>
			</BlockControls>
			<div { ...innerBlocksProps } />
		</>
	);
}
