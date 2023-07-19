<?php
/**
 * Tests for Font Family Utils class
 *
 * @package Gutenberg
 */

class WP_Font_Family_Test extends WP_UnitTestCase {

    const FONT_DATA_1 = array(
        'name' => 'Piazzolla',
        'slug' => 'piazzolla',
        'fontFamily' => 'Piazzolla',
        'fontFace' => [
            array(
                'fontFamily' => 'Piazzolla',
                'fontStyle' => 'italic',
                'fontWeight' => '400',
                'src' => 'http://fonts.gstatic.com/s/piazzolla/v33/N0b72SlTPu5rIkWIZjVgI-TckS03oGpPETyEJ88Rbvi0_TzOzKcQhZqx3gX9BRy5m5M.ttf'
            )
        ]
    );

    const FONT_DATA_2 = array(
        'name' => 'Arial',
        'slug' => 'arial',
        'fontFamily' => 'Arial',
    );

    function test_get_data () {
        $font = new WP_Font_Family( self::FONT_DATA_1 );
        $this->assertEquals( $font->get_data()['slug'], 'piazzolla' );
        $this->assertEquals( count( $font->get_data()['fontFace'] ), 1 );
    }

    function test_get_data_as_json () {
        $font = new WP_Font_Family( self::FONT_DATA_1 );
        $this->assertEquals( $font->get_data_as_json(), wp_json_encode( self::FONT_DATA_1 ) );
    }

    function test_has_font_faces () {
        $font1 = new WP_Font_Family( self::FONT_DATA_1 );
        $this->assertTrue( $font1->has_font_faces() );

        $font2 = new WP_Font_Family( self::FONT_DATA_2 );
        $this->assertFalse( $font2->has_font_faces() );
    }

    function test_install_and_uninstall_google_font () {
        $font = new WP_Font_Family( self::FONT_DATA_1 );
        $font->install();
        
        // Check that the post was created
        $post = $font->get_font_post();
        $this->assertInstanceof( 'WP_Post', $post );
        
        // Check that the post has the correct data
        $this->assertEquals( $post->post_title, 'Piazzolla' );
        $this->assertEquals( $post->post_name, 'piazzolla' );
        $content = json_decode( $post->post_content, true );
        $this->assertEquals( $content['fontFamily'], 'Piazzolla' );
        $this->assertEquals( $content['slug'], 'piazzolla' );
        $this->assertEquals( $content['fontFace'][0]['fontFamily'], 'Piazzolla' );
        $this->assertEquals( $content['fontFace'][0]['fontStyle'], 'italic' );
        $this->assertEquals( $content['fontFace'][0]['fontWeight'], '400' );

        // Check that the font file src was updated to the local font asset
        $this->assertTrue( str_ends_with( $content['fontFace'][0]['src'], '/piazzolla_italic_400.ttf' )  );

        // Check that the font file was created
        $this->assertTrue( file_exists( WP_FONTS_DIR . '/piazzolla_italic_400.ttf' ) );

        $font->uninstall();

        // Check that the post was deleted
        $post = $font->get_font_post();
        $this->assertNull( $post );

        // Check that the font asset was deleted
        $this->assertFalse( file_exists( WP_FONTS_DIR . '/piazzolla_italic_400.ttf' ) );
    }

    function test_install_and_uninstall_font_without_faces () {
        $font = new WP_Font_Family( self::FONT_DATA_2 );
        $font->install();

        // Check that the post was created
        $post = $font->get_font_post();
        $this->assertInstanceof( 'WP_Post', $post );

        // Check that the post has the correct data
        $this->assertEquals( $post->post_title, 'Arial' );
        $this->assertEquals( $post->post_name, 'arial' );
        $content = json_decode( $post->post_content, true );
        $this->assertEquals( $content['fontFamily'], 'Arial' );
        $this->assertEquals( $content['slug'], 'arial' );
        $this->assertArrayNotHasKey( 'fontFace', $content );

        $font->uninstall();

        // Check that the post was deleted
        $post = $font->get_font_post();
        $this->assertNull( $post );
    } 


}
