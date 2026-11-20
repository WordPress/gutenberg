import { describe, expect, it } from 'vitest';
import msCommentRemover from '../ms-comment-remover';
import { deepFilterHTML } from '../utils';

describe( 'msCommentRemover', () => {
	it( 'should remove the comment marker from the text', () => {
		const input =
			'<p>Some text<span class="MsoCommentReference"><span style="font-size:8.0pt"><a class="msocomanchor" id="_anchor_1" href="#_msocom_1" name="_msoanchor_1">[AB1]</a><span style="mso-special-character:comment">&nbsp;</span></span></span>.</p>';
		const output = '<p>Some text.</p>';
		expect( deepFilterHTML( input, [ msCommentRemover ] ) ).toEqual(
			output
		);
	} );

	it( 'should remove the comment marker when it is not wrapped in a reference span', () => {
		const input =
			'<p>Some text<a class="msocomanchor" href="#_msocom_1">[AB1]</a>.</p>';
		const output = '<p>Some text.</p>';
		expect( deepFilterHTML( input, [ msCommentRemover ] ) ).toEqual(
			output
		);
	} );

	it( 'should remove the list of comments', () => {
		const input =
			'<p>Some text.</p><div style="mso-element:comment-list"><hr class="msocomoff" align="left" size="1" width="33%"><div style="mso-element:comment"><div id="_com_1" class="msocomtxt"><span style="mso-comment-author:&quot;Test Author&quot;"><a name="_msocom_1"></a></span><p class="MsoCommentText"><span class="MsoCommentReference"><a href="#_msoanchor_1" class="msocomoff">[AB1]</a></span>A comment.</p></div></div></div>';
		const output = '<p>Some text.</p>';
		expect( deepFilterHTML( input, [ msCommentRemover ] ) ).toEqual(
			output
		);
	} );

	it( 'should keep the commented text', () => {
		const input =
			'<p>Some <a style="mso-comment-reference:AB_1;mso-comment-date:20240101T1200"><span style="mso-comment-continuation:1">commented</span></a> text.</p>';
		const output =
			'<p>Some <span style="mso-comment-continuation:1">commented</span> text.</p>';
		expect( deepFilterHTML( input, [ msCommentRemover ] ) ).toEqual(
			output
		);
	} );

	it( 'should remove the empty anchor of a reply', () => {
		const input =
			'<p>Some <a style="mso-comment-reference:AB_2;mso-comment-date:20240101T1200;mso-comment-parent:1"></a>text.</p>';
		const output = '<p>Some text.</p>';
		expect( deepFilterHTML( input, [ msCommentRemover ] ) ).toEqual(
			output
		);
	} );

	it( 'should keep a link the comment was made on', () => {
		const input =
			'<p>Some <a href="https://w.org/" style="mso-comment-reference:AB_1;mso-comment-date:20240101T1200">link</a>.</p>';
		expect( deepFilterHTML( input, [ msCommentRemover ] ) ).toEqual(
			input
		);
	} );

	it( 'should keep footnotes and links', () => {
		const input =
			'<p>A <a href="https://w.org/">link</a> and a footnote<a style="mso-footnote-id:ftn1" href="#_ftn1" name="_ftnref1"><span class="MsoFootnoteReference">[1]</span></a>.</p><div style="mso-element:footnote-list"><div style="mso-element:footnote" id="ftn1"><p class="MsoFootnoteText"><a href="#_ftnref1" name="_ftn1">[1]</a> A footnote.</p></div></div>';
		expect( deepFilterHTML( input, [ msCommentRemover ] ) ).toEqual(
			input
		);
	} );
} );
