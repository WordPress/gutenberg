/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/editor';

export default function ListLevel( props ) {
	const { edit, attributes, setAttributes } = props;
	let childnodes = null;

	if ( props.children ) {
		childnodes = props.children.map( function( childnode ) {
			const link = getLinkElement( childnode, props );

			return (
				<li key={ childnode.block.anchor }>
					{ link }
					{ childnode.children ? (
						<ListLevel
							edit={ edit }
							attributes={ attributes }
							setAttributes={ setAttributes }
						>
							{ childnode.children }
						</ListLevel>
					) : null }
				</li>
			);
		} );

		return <ul>{ childnodes }</ul>;
	}
}

function getLinkElement( childnode, props ) {
	const { edit, attributes, setAttributes } = props;
	const { headings, autosync } = attributes;

	const updateHeading = ( content ) => {
		headings[ childnode.index ].content = content;
		setAttributes( { headings } );
	};

	if ( autosync ) {
		return (
			<a
				href={ childnode.block.anchor }
				data-level={ childnode.block.level }
			>
				{ childnode.block.content }
			</a>
		);
	}

	if ( edit ) {
		return (
			<RichText
				tagName="a"
				href={ childnode.block.anchor }
				data-level={ childnode.block.level }
				onChange={ ( content ) => updateHeading( content ) }
				value={ childnode.block.content }
			/>
		);
	}

	return (
		<RichText.Content
			tagName="a"
			href={ childnode.block.anchor }
			data-level={ childnode.block.level }
			value={ childnode.block.content }
		/>
	);
}
