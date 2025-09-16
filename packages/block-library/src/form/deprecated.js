/**
 * WordPress dependencies
 */
import {
	InnerBlocks,
	useBlockProps,
	getTypographyClassesAndStyles,
	__experimentalGetColorClassesAndStyles as getColorClassesAndStyles,
	__experimentalGetSpacingClassesAndStyles as getSpacingClassesAndStyles,
} from '@wordpress/block-editor';

const v1 = {
	// The block supports here are deliberately empty despite this
	// deprecated version of the block having adopted block supports.
	// The attributes added by these supports have been manually
	// added to this deprecated version's attributes definition so
	// that the data isn't lost on migration. All this is so that the
	// automatic application of block support classes doesn't occur
	// as this version of the block had a bug that overrode those
	// classes. If those block support classes are applied during the
	// deprecation process, this deprecation doesn't match and won't
	// run.
	// @see https://github.com/WordPress/gutenberg/pull/55755
	supports: {},
	attributes: {
		submissionMethod: {
			type: 'string',
			default: 'email',
		},
		method: {
			type: 'string',
			default: 'post',
		},
		action: {
			type: 'string',
		},
		email: {
			type: 'string',
		},
		// The following attributes have been added to match the block
		// supports at the time of the deprecation. See above for details.
		anchor: {
			type: 'string',
			source: 'attribute',
			attribute: 'id',
			selector: '*',
		},
		backgroundColor: {
			type: 'string',
		},
		textColor: {
			type: 'string',
		},
		gradient: {
			type: 'string',
		},
		style: {
			type: 'object',
		},
		fontFamily: {
			type: 'string',
		},
		fontSize: {
			type: 'string',
		},
	},
	save( { attributes } ) {
		const { submissionMethod } = attributes;
		const colorProps = getColorClassesAndStyles( attributes );
		const typographyProps = getTypographyClassesAndStyles( attributes );
		const spacingProps = getSpacingClassesAndStyles( attributes );
		const blockProps = useBlockProps.save( {
			// In this deprecated version, the block support is deliberately empty.
			// As a result, the useBlockProps.save() does not output style or id attributes,
			// so we apply them explicitly here.
			style: {
				...colorProps.style,
				...typographyProps.style,
				...spacingProps.style,
			},
			id: attributes.anchor,
		} );

		return (
			<form
				{ ...blockProps }
				className="wp-block-form"
				encType={ submissionMethod === 'email' ? 'text/plain' : null }
			>
				<InnerBlocks.Content />
			</form>
		);
	},
};

export default [ v1 ];
