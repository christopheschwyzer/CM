<?php

class CM_Usertext_Filter_MarkdownTest extends CMTest_TestCase {

    public function testProcess() {
        $text = "#Headline#\n * element1\n * element1\n\nparagraph\n\nfoo_bar_foo\nfoo _bar_ foo\nLink: [google.com](http://www.google.com)\ntest2\n![Img text](/path/to/img.jpg)";
        $expected = "<h1>Headline</h1>\n<ul>\n<li>element1</li>\n<li>element1</li>\n</ul>\n<p>paragraph</p>\n<p>foo_bar_foo</p>\n<p>foo <em>bar</em> foo</p>\n<p>Link: <a href=\"http://www.google.com\">google.com</a></p>\n<p>test2</p>\n<p><img src=\"/path/to/img.jpg\" alt=\"Img text\" /></p>\n";
        $filter = new CM_Usertext_Filter_Markdown();
        $actual = $filter->transform($text, new CM_Frontend_Render());

        $this->assertSame($expected, $actual);
    }

    public function testProcessWithoutLinks() {
        $text = "#Headline#\n * element1\n * element1\n\nparagraph\nLink: [google.com](http://www.google.com)\ntest2";
        $expected = "<h1>Headline</h1>\n<ul>\n<li>element1</li>\n<li>element1</li>\n</ul>\n<p>paragraph</p>\n<p>Link: google.com</p>\n<p>test2</p>\n";
        $filter = new CM_Usertext_Filter_Markdown(true);
        $actual = $filter->transform($text, new CM_Frontend_Render());

        $this->assertSame($expected, $actual);
    }

    public function testProcessWithImgLazy() {
        $text = "#Headline#\n * element1\n * element1\n\nparagraph\n\nfoo_bar_foo\nfoo _bar_ foo\nLink: [google.com](http://www.google.com)\ntest2\n![Img text](/path/to/img.jpg){\$200x100}";
        $filter = new CM_Usertext_Filter_Markdown(null);
        $actual = $filter->transform($text, new CM_Frontend_Render());
        $this->assertStringStartsWith("<h1>Headline</h1>\n<ul>\n<li>element1</li>\n<li>element1</li>\n</ul>\n<p>paragraph</p>\n<p>foo_bar_foo</p>\n<p>foo <em>bar</em> foo</p>\n<p>Link: <a href=\"http://www.google.com\">google.com</a></p>\n<p>test2</p>", $actual);

        $expected = '/<div class="contentPlaceholder"><img class="contentPlaceholder-size" src="[^"]+"\/><img data-src="\/path\/to\/img\.jpg" alt="Img text" class="lazy"\/><\/div>/';
        $this->assertRegExp($expected, $actual);
    }
}
