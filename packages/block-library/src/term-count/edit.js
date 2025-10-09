/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	useBlockProps,
	BlockControls,
	AlignmentControl,
} from '@wordpress/block-editor';
import { ToolbarGroup, ToolbarDropdownMenu } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { useTermCount } from './use-term-count';
import { bareNumber, numberInParenthesis } from './icons';

export default function TermCountEdit( {
	attributes,
	setAttributes,
	context: { termId, taxonomy },
} ) {
	const { textAlign, hasParenthesis } = attributes;
	const term = useTermCount( termId, taxonomy );

	const termCount = term?.termCount || 0;

	const blockProps = useBlockProps( {
		classCount: clsx( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
	} );

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

	let termCountDisplay = termCount;
	if ( hasParenthesis ) {
		termCountDisplay = sprintf(
			/* translators: %d: term count number. */
			__( '(%d)' ),
			termCount
		);
	}

	return (
		<>
			<BlockControls group="block">
				<ToolbarGroup>
					<ToolbarDropdownMenu
						icon={ getDisplayTypeIcon() }
						label={ __( 'Change display type' ) }
						controls={ displayTypeControls }
					/>
				</ToolbarGroup>
				<AlignmentControl
					value={ textAlign }
					onChange={ ( nextAlign ) => {
						setAttributes( { textAlign: nextAlign } );
					} }
				/>
			</BlockControls>
			<div { ...blockProps }>{ termCountDisplay }</div>
		</>
	);
}
