/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useBlockProps, BlockControls } from '@wordpress/block-editor';
import { ToolbarDropdownMenu } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getBracketIcon } from './icons';
import { useTermCount } from './use-term-count';

const BRACKET_TYPES = {
	none: { label: __( 'No brackets' ) },
	round: {
		label: __( 'Round brackets' ),
		before: '(',
		after: ')',
	},
	square: {
		label: __( 'Square brackets' ),
		before: '[',
		after: ']',
	},
	curly: {
		label: __( 'Curly brackets' ),
		before: '{',
		after: '}',
	},
	angle: {
		label: __( 'Angle brackets' ),
		before: '<',
		after: '>',
	},
};

export default function TermCountEdit( {
	attributes,
	setAttributes,
	context: { termId, taxonomy },
} ) {
	const { bracketType } = attributes;
	const term = useTermCount( termId, taxonomy );

	const termCount = term?.termCount || 0;

	const blockProps = useBlockProps();

	const bracketTypeControls = Object.entries( BRACKET_TYPES ).map(
		( [ type, { label } ] ) => ( {
			role: 'menuitemradio',
			title: label,
			isActive: bracketType === type,
			icon: getBracketIcon( type ),
			onClick: () => {
				setAttributes( { bracketType: type } );
			},
		} )
	);

	const formatTermCount = ( count, type ) => {
		const { before = '', after = '' } = BRACKET_TYPES[ type ] || {};
		return `${ before }${ count }${ after }`;
	};

	return (
		<>
			<BlockControls group="block">
				<ToolbarDropdownMenu
					icon={ getBracketIcon( bracketType ) }
					label={ __( 'Change bracket type' ) }
					controls={ bracketTypeControls }
				/>
			</BlockControls>
			<div { ...blockProps }>
				{ formatTermCount( termCount, bracketType ) }
			</div>
		</>
	);
}
