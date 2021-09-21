/**
 * WordPress dependencies
 */
import { cloneBlock } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';

function PreviewHeader( { pattern, onInsertBlocks } ) {
	const { title, categories = [], blocks } = pattern;
	const baseCssClass = 'block-editor-pattern-explorer__preview__header';

	return (
		<div className={ baseCssClass }>
			<div className={ `${ baseCssClass }__title` }>{ title }</div>
			{ !! categories?.length && (
				// Todo print categories properly
				<div className={ `${ baseCssClass }__category` }>
					{ categories.map( ( category ) => (
						<span key={ category }>{ category }</span>
					) ) }
				</div>
			) }
			<div className={ `${ baseCssClass }__choose` }>
				<Button
					onClick={ () =>
						onInsertBlocks(
							blocks.map( ( block ) => cloneBlock( block ) )
						)
					}
					isPrimary
				>
					{ __( 'Choose' ) }
				</Button>
			</div>
		</div>
	);
}

export default PreviewHeader;
