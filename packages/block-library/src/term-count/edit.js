/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useBlockProps, BlockControls } from '@wordpress/block-editor';
import { ToolbarDropdownMenu } from '@wordpress/components';

/**
 * Internal dependencies
 */
import {
	bareNumber,
	numberInParenthesis,
	numberInSquareBrackets,
	numberInCurlyBrackets,
	numberInAngleBrackets,
} from './icons';
import { useTermCount } from './use-term-count';

const BRACKET_TYPES = {
	none: { label: __( 'No brackets' ), icon: bareNumber },
	round: {
		label: __( 'Round brackets' ),
		icon: numberInParenthesis,
		before: '(',
		after: ')',
	},
	square: {
		label: __( 'Square brackets' ),
		icon: numberInSquareBrackets,
		before: '[',
		after: ']',
	},
	curly: {
		label: __( 'Curly brackets' ),
		icon: numberInCurlyBrackets,
		before: '{',
		after: '}',
	},
	angle: {
		label: __( 'Angle brackets' ),
		icon: numberInAngleBrackets,
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
		( [ type, { label, icon } ] ) => ( {
			role: 'menuitemradio',
			title: label,
			isActive: bracketType === type,
			icon,
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
					icon={ BRACKET_TYPES[ bracketType ]?.icon ?? bareNumber }
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
