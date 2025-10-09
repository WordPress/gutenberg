/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useBlockProps, BlockControls } from '@wordpress/block-editor';
import { ToolbarGroup, ToolbarDropdownMenu } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { bareNumber, numberInParenthesis } from './icons';
import { useTermCount } from './use-term-count';

export default function TermCountEdit( {
	attributes,
	setAttributes,
	context: { termId, taxonomy },
} ) {
	const { hasParenthesis } = attributes;
	const term = useTermCount( termId, taxonomy );

	const termCount = term?.termCount || 0;

	const blockProps = useBlockProps();

	const displayTypeControls = [
		{
			role: 'menuitemradio',
			title: __( 'In Parenthesis' ),
			isActive: hasParenthesis,
			icon: numberInParenthesis,
			onClick: () => {
				setAttributes( { hasParenthesis: true } );
			},
		},
		{
			role: 'menuitemradio',
			title: __( 'Bare Number' ),
			isActive: ! hasParenthesis,
			icon: bareNumber,
			onClick: () => {
				setAttributes( { hasParenthesis: false } );
			},
		},
	];

	return (
		<>
			<BlockControls group="block">
				<ToolbarGroup>
					<ToolbarDropdownMenu
						icon={
							hasParenthesis ? numberInParenthesis : bareNumber
						}
						label={ __( 'Change display type' ) }
						controls={ displayTypeControls }
					/>
				</ToolbarGroup>
			</BlockControls>
			<div { ...blockProps }>
				{ hasParenthesis
					? sprintf(
							/* translators: %d: term count number. */
							__( '(%d)' ),
							termCount
					  )
					: termCount }
			</div>
		</>
	);
}
