/**
 * WordPress dependencies
 */
import { useNavigate, useSearch } from '@wordpress/route';
import { Page } from '@wordpress/admin-ui';
import { __ } from '@wordpress/i18n';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import './style.scss';
import { unlock } from '../lock-unlock';

const { GlobalStylesUIWrapper, GlobalStylesActionMenu } =
	unlock( editorPrivateApis );

function Stage() {
	const navigate = useNavigate();
	const search = useSearch( { strict: false } ) as any;
	const isMobileViewport = useViewportMatch( 'medium', '<' );

	const section = ( search.section ?? '/' ) as string;

	const onChangeSection = ( updatedSection: string ) => {
		navigate( {
			search: {
				...search,
				section: updatedSection,
			},
		} );
	};

	return (
		<Page
			actions={
				! isMobileViewport ? (
					<GlobalStylesActionMenu
						hideWelcomeGuide
						onChangePath={ onChangeSection }
					/>
				) : null
			}
			className="routes-styles__page"
			title={ __( 'Styles' ) }
		>
			<GlobalStylesUIWrapper
				path={ section }
				onPathChange={ onChangeSection }
			/>
		</Page>
	);
}

export const stage = Stage;
