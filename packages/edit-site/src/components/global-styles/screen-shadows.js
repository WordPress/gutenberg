/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalVStack as VStack,
	Button,
	Panel,
} from '@wordpress/components';
import { plus } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import ScreenHeader from './header';
import { useStyle } from './hooks';
import Subtitle from './subtitle';
import BlockPreview from './block-preview';
import { getShadowString, parseShadowString } from './shadow-utils';
import { ShadowPanel } from './shadows-panel';

const ShadowsContainer = styled.div`
	// NOTE: this is a temporary component to add left and right borders to Panel
	// if the Panel is the finalized component, then it needs to be updated to have borders on all sides based on a prop
	// and this component will be removed.
	& .components-panel__body {
		border-left: 1px solid #e0e0e0;
		border-right: 1px solid #e0e0e0;
	}
`;

function ScreenShadows( { name } ) {
	const [ shadow, setShadow ] = useStyle( 'shadow', name );
	// if given shadow is an array, convert to string
	const shadows = parseShadowString([].concat(shadow).flat().join(', '));

	function handleShadowChange(newShadow, index) {
		const shadowsCopy = [...shadows];
		shadowsCopy[index] = newShadow;
		const shadowString = getShadowString(shadowsCopy);
		setShadow(shadowString);
	}

	function handleShadowDelete(index) {
		const shadowsCopy = [...shadows];
		shadowsCopy.splice(index, 1);
		const shadowString = getShadowString(shadowsCopy);
		setShadow(shadowString);
	}

	function addNewShadow() {
		const newShadow = parseShadowString('5px 5px 0 0 var(--wp--preset--color--primary)').shift();
		handleShadowChange(newShadow, shadows.length);
	}

	return (
		<>
			<ScreenHeader
				title={ __( 'Shadows' ) }
				description={ __(
					'Manage block shadows of different global elements on the site.'
				) }
			/>

			<div className="edit-site-global-styles-screen-colors">
				<VStack spacing={ 5 }>

					<VStack spacing={ 3 }>
						<Subtitle>{ __( 'Preview' ) }</Subtitle>
						<BlockPreview label={__( 'Preview' )} name={ name } />
					</VStack>

					<VStack spacing={ 3 }>
						<Subtitle>{ __( 'Shadows' ) }</Subtitle>

						<Panel>
							<ShadowsContainer>
								{ shadows.map((shadowObj, index) => 
									<ShadowPanel 
										key={index} 
										shadow={shadowObj} 
										onChange={(s) => handleShadowChange(s, index)} 
										onDelete={() => handleShadowDelete(index)} />
									)
								}
							</ShadowsContainer>
						</Panel>

						<Button variant='tertiary' icon={plus} onClick={addNewShadow}>{__( 'Add new shadow' )}</Button>
					</VStack>
					
				</VStack>
			</div>
		</>
	);
}

export default ScreenShadows;
