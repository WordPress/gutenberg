/**
 * WordPress dependencies
 */
import { useNavigate, useSearch } from '@wordpress/route';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { useEditorAssets } from '@wordpress/lazy-editor';
import { Spinner } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';

const { StyleBookPreview } = unlock( editorPrivateApis );

function Canvas() {
	const { isReady: assetsReady } = useEditorAssets();
	const navigate = useNavigate();
	const search = useSearch( { strict: false } ) as any;

	// Get section from URL query params
	const section = ( search.section ?? '/' ) as string;

	const onChangeSection = ( updatedSection: string ) => {
		navigate( {
			search: {
				...search,
				section: updatedSection,
			},
		} );
	};

	if ( ! assetsReady ) {
		return (
			<div
				style={ {
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					height: '100%',
				} }
			>
				<Spinner />
			</div>
		);
	}

	return (
		<StyleBookPreview path={ section } onPathChange={ onChangeSection } />
	);
}

export const canvas = Canvas;
