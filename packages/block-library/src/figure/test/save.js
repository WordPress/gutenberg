/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import save from '../save';

jest.mock( '@wordpress/block-editor', () => {
	const originalModule = jest.requireActual( '@wordpress/block-editor' );
	return {
		...originalModule,
		useBlockProps: {
			save: ( props ) => ( { ...props, 'data-block-props': true } ),
		},
		InnerBlocks: {
			Content: () => (
				<div className="mock-inner-blocks">Inner Content</div>
			),
		},
		RichText: {
			Content: ( { tagName: Tag, className, value } ) => (
				<Tag className={ className }>{ value }</Tag>
			),
		},
	};
} );

describe( 'core/figure save', () => {
	it( 'should render a basic figure with inner blocks and no caption', () => {
		const attributes = {
			caption: '',
			captionPosition: 'bottom',
		};

		render( save( { attributes } ) );
		const figure = screen.getByRole( 'figure' );

		expect( figure ).toHaveClass( 'is-caption-bottom' );
		expect( figure ).toMatchInlineSnapshot( `
		<figure
		  class="is-caption-bottom"
		  data-block-props="true"
		>
		  <div
		    class="wp-block-figure__content"
		  >
		    <div
		      class="mock-inner-blocks"
		    >
		      Inner Content
		    </div>
		  </div>
		</figure>
		` );
	} );

	it( 'should render a caption at the bottom', () => {
		const attributes = {
			caption: 'A beautiful sunset',
			captionPosition: 'bottom',
		};

		render( save( { attributes } ) );
		const figure = screen.getByRole( 'figure' );
		const caption = screen.getByText( 'A beautiful sunset' );

		expect( figure ).toContainElement( caption );
		expect( figure ).toHaveClass( 'is-caption-bottom' );

		expect( figure ).toMatchInlineSnapshot( `
		<figure
		  class="is-caption-bottom"
		  data-block-props="true"
		>
		  <div
		    class="wp-block-figure__content"
		  >
		    <div
		      class="mock-inner-blocks"
		    >
		      Inner Content
		    </div>
		  </div>
		  <figcaption
		    class="wp-element-caption"
		  >
		    A beautiful sunset
		  </figcaption>
		</figure>
		` );
	} );

	it( 'should render a caption at the top', () => {
		const attributes = {
			caption: 'A beautiful sunset',
			captionPosition: 'top',
		};

		render( save( { attributes } ) );
		const figure = screen.getByRole( 'figure' );

		expect( figure ).toHaveClass( 'is-caption-top' );
		expect( figure ).toHaveTextContent( 'A beautiful sunset' );

		expect( figure ).toMatchInlineSnapshot( `
		<figure
		  class="is-caption-top"
		  data-block-props="true"
		>
		  <figcaption
		    class="wp-element-caption"
		  >
		    A beautiful sunset
		  </figcaption>
		  <div
		    class="wp-block-figure__content"
		  >
		    <div
		      class="mock-inner-blocks"
		    >
		      Inner Content
		    </div>
		  </div>
		</figure>
		` );
	} );

	it( 'should apply text alignment classes', () => {
		const attributes = {
			caption: 'Aligned caption',
			captionPosition: 'bottom',
			textAlign: 'center',
		};

		render( save( { attributes } ) );
		const figure = screen.getByRole( 'figure' );

		expect( figure ).toHaveClass( 'has-text-align-center' );
	} );
} );
