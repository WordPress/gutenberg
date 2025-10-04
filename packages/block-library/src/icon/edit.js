/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';
import { useEntityRecords } from '@wordpress/core-data';
import { __experimentalGrid as Grid } from '@wordpress/components';

export default function Edit() {
	const blockProps = useBlockProps();

	const { records: icons, hasResolved } = useEntityRecords( 'root', 'icon', {
		per_page: -1,
	} );

	if ( ! hasResolved ) {
		return <div { ...blockProps }>Loading...</div>;
	}

	if ( ! icons || icons.length === 0 ) {
		return <div { ...blockProps }>No icons found</div>;
	}

	return (
		<div { ...blockProps }>
			<Grid columns={ 10 } gap={ 1 } justify="center">
				{ icons.map( ( icon ) => (
					<div
						key={ icon.name }
						dangerouslySetInnerHTML={ { __html: icon.content } }
						style={ {
							width: '24px',
							height: '24px',
						} }
					/>
				) ) }
			</Grid>
		</div>
	);
}
