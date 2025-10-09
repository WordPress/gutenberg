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

	const getDisplayTypeIcon = () => {
		switch ( hasParenthesis ) {
			case true:
				return numberInParenthesis;
			case false:
				return bareNumber;
		}
	};

	const displayTypeControls = [
		{
			role: 'menuitemradio',
			title: __( 'In Parenthesis' ),
			isActive: hasParenthesis === true,
			icon: numberInParenthesis,
			onClick: () => {
				setAttributes( { hasParenthesis: true } );
			},
		},
		{
			role: 'menuitemradio',
			title: __( 'Bare Number' ),
			isActive: hasParenthesis === false,
			icon: bareNumber,
			onClick: () => {
				setAttributes( { hasParenthesis: false } );
			},
		},
	];

	const controls = (
		<BlockControls group="block">
			<ToolbarGroup>
				<ToolbarDropdownMenu
					icon={ getDisplayTypeIcon() }
					label={ __( 'Change display type' ) }
					controls={ displayTypeControls }
				/>
			</ToolbarGroup>
		</BlockControls>
	);

	// Render output based on the selected display type.
	const renderDisplay = () => {
		if ( hasParenthesis ) {
			return sprintf(
				/* translators: %d: term count number. */
				__( '(%d)' ),
				termCount
			);
		}
		return termCount;
	};

	return (
		<div { ...blockProps }>
			{ controls }
			{ renderDisplay() }
		</div>
	);
}
