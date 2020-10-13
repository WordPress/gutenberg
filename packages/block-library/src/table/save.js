/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { RichText, getColorClassName } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const {
		hasFixedLayout,
		head,
		body,
		foot,
		backgroundColor,
		caption,
		figure,
	} = attributes;
	const isEmpty = ! head.length && ! body.length && ! foot.length;

	if ( isEmpty ) {
		return null;
	}

	const backgroundClass = getColorClassName(
		'background-color',
		backgroundColor
	);

	const classes = classnames( backgroundClass, {
		'has-fixed-layout': hasFixedLayout,
		'has-background': !! backgroundClass,
	} );

	const hasCaption = ! RichText.isEmpty( caption );

	const Wrapper = figure ? 'figure' : 'div';

	const Section = ( { type, rows } ) => {
		if ( ! rows.length ) {
			return null;
		}

		const Tag = `t${ type }`;

		return (
			<Tag>
				{ rows.map( ( { cells }, rowIndex ) => (
					<tr key={ rowIndex }>
						{ cells.map(
							( { content, tag, scope, align }, cellIndex ) => {
								const cellClasses = classnames( {
									[ `has-text-align-${ align }` ]: align,
								} );

								return (
									<RichText.Content
										className={
											cellClasses
												? cellClasses
												: undefined
										}
										data-align={ align }
										tagName={ tag }
										value={ content }
										key={ cellIndex }
										scope={
											tag === 'th' ? scope : undefined
										}
									/>
								);
							}
						) }
					</tr>
				) ) }
			</Tag>
		);
	};

	return (
		<Wrapper>
			<table className={ classes === '' ? undefined : classes }>
				{ hasCaption && ! figure && (
					<RichText.Content tagName="caption" value={ caption } />
				) }
				<Section type="head" rows={ head } />
				<Section type="body" rows={ body } />
				<Section type="foot" rows={ foot } />
			</table>
			{ hasCaption && figure && (
				<RichText.Content tagName="figcaption" value={ caption } />
			) }
		</Wrapper>
	);
}
