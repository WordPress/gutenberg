/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { Flex, FlexItem, Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import ImageExplorerModal from './explorer-modal';

export default function ImageExplorerButton() {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const baseCssClass = 'block-editor-inserter__panel-header-images';
	const className = classnames(
		'block-editor-inserter__panel-header',
		baseCssClass
	);
	return (
		<>
			<Flex
				justify="space-between"
				align="center"
				gap="4"
				className={ className }
			>
				<FlexItem isBlock className={ `${ baseCssClass }__text` }>
					{ __( 'Search external images' ) }
				</FlexItem>
				<FlexItem>
					<Button
						variant="secondary"
						onClick={ () => setIsModalOpen( true ) }
						label={ __( 'Explore all external images' ) }
					>
						{ _x(
							'Explore',
							'Label for showing external images list.'
						) }
					</Button>
				</FlexItem>
			</Flex>
			{ isModalOpen && (
				<ImageExplorerModal
					onModalClose={ () => setIsModalOpen( false ) }
				/>
			) }
		</>
	);
}
