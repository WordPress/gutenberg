/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalNavigatorButton as NavigatorButton,
	__experimentalSurface as Surface,
	Tooltip,
} from '@wordpress/components';
import { Icon, chevronRight } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import ScreenHeader from './header';
import FontFaceItem from './font-face-item';
import { useSetting } from './hooks';

function ScreenThemeFontFamilies( { setThemeFontSelected } ) {
	const [ fontFamilies ] = useSetting( 'typography.fontFamilies' );

	const handleClick = ( family ) => {
		setThemeFontSelected( family );
	};

	return (
		<>
			<ScreenHeader
				title={ __( 'Theme Font Families' ) }
				description={ __( 'Font families included in your theme' ) }
			/>

			<Surface
				style={ {
					background: '#eee',
					padding: '1rem',
					display: 'flex',
					flexDirection: 'column',
					gap: '1rem',
				} }
			>
				{ fontFamilies.map( ( family ) => {
					const fontFace = {
						name: family.name,
						fontFamily: family.fontFamily,
						fontStyle: 'normal',
						fontWeight: '400',
					};
					return (
						<FontFaceItem
							key={ family.fontFamily }
							fontFace={ fontFace }
							title={
								<strong>
									{ fontFace.name || fontFace.fontFamily }
								</strong>
							}
							actionTrigger={
								family.fontFace?.length && (
									<Tooltip
										text={ __( 'View font variants' ) }
									>
										<NavigatorButton
											path="/typography/font-families/theme-font-faces"
											onClick={ () => {
												handleClick( family );
											} }
										>
											<Icon
												icon={ chevronRight }
												size={ 15 }
											/>
										</NavigatorButton>
									</Tooltip>
								)
							}
						/>
					);
				} ) }
			</Surface>
		</>
	);
}

export default ScreenThemeFontFamilies;
