/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/editor';

export default function ListLevel( props ) {
	const { edit, attributes, setAttributes } = props;
	let childNodes = null;

	if ( props.children ) {
		childNodes = props.children.map( function( childNode ) {
			const link = getLinkElement( childNode, props );

			return (
				<li key={ childNode.block.anchor }>
					{ link }
					{ childNode.children ? (
						<ListLevel
							edit={ edit }
							attributes={ attributes }
							setAttributes={ setAttributes }
						>
							{ childNode.children }
						</ListLevel>
					) : null }
				</li>
			);
		} );

		return <ul>{ childNodes }</ul>;
	}
}

function getLinkElement( childNode, props ) {
	const { edit, attributes, setAttributes } = props;
	const { headings, autosync } = attributes;

	const updateHeading = ( content ) => {
		headings[ childNode.index ].content = content;
		setAttributes( { headings } );
	};

	if ( autosync ) {
		return (
			<a
				href={ childNode.block.anchor }
				data-level={ childNode.block.level }
			>
				{ childNode.block.content }
			</a>
		);
	}

	if ( edit ) {
		return (
			<RichText
				tagName="a"
				href={ childNode.block.anchor }
				data-level={ childNode.block.level }
				onChange={ ( content ) => updateHeading( content ) }
				value={ childNode.block.content }
			/>
		);
	}

	return (
		<RichText.Content
			tagName="a"
			href={ childNode.block.anchor }
			data-level={ childNode.block.level }
			value={ childNode.block.content }
		/>
	);
}
