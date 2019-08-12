/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { RichText, getColorClassName } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import metadata from './block.json';

const supports = {
	align: true,
};

const deprecated = [
	{
		attributes: metadata.attributes,
		supports,
		save( { attributes } ) {
			const {
				hasFixedLayout,
				head,
				body,
				foot,
				backgroundColor,
			} = attributes;
			const isEmpty = ! head.length && ! body.length && ! foot.length;

			if ( isEmpty ) {
				return null;
			}

			const backgroundClass = getColorClassName( 'background-color', backgroundColor );

			const classes = classnames( backgroundClass, {
				'has-fixed-layout': hasFixedLayout,
				'has-background': !! backgroundClass,
			} );

			const Section = ( { type, rows } ) => {
				if ( ! rows.length ) {
					return null;
				}

				const Tag = `t${ type }`;

				return (
					<Tag>
						{ rows.map( ( { cells }, rowIndex ) => (
							<tr key={ rowIndex }>
								{ cells.map( ( { content, tag, scope }, cellIndex ) =>
									<RichText.Content
										tagName={ tag }
										value={ content }
										key={ cellIndex }
										scope={ tag === 'th' ? scope : undefined }
									/>
								) }
							</tr>
						) ) }
					</Tag>
				);
			};

			return (
				<table className={ classes }>
					<Section type="head" rows={ head } />
					<Section type="body" rows={ body } />
					<Section type="foot" rows={ foot } />
				</table>
			);
		},
	},
];

export default deprecated;
