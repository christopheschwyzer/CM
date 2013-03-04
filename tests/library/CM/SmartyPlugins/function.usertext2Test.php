<?php

require_once CM_Util::getNamespacePath('CM') . 'library/CM/SmartyPlugins/function.usertext2.php';

class smarty_modifier_usertext2Test extends CMTest_TestCase {

	/**
	 * @var Smarty_Internal_Template
	 */
	private $_template;

	public function setUp() {
		$smarty = new Smarty();
		$render = new CM_Render($this->_getSite());
		$this->_template = $smarty->createTemplate('string:');
		$this->_template->assignGlobal('render', $render);
	}

	public function testModeOneline() {
		$this->_assertSame('<span class="usertext2 oneline">foo</span>', array('text' => 'foo', 'mode' => 'oneline'));
	}

	public function testModeSimple() {
		$this->_assertSame("<span class=\"usertext2 simple\">foo<br />\nbar</span>", array('text' => "foo  \nbar   \n", 'mode' => 'simple'));
	}

	public function testModeMarkdown() {
		$this->_assertSame("<span class=\"usertext2 markdown\"><h1>Headline</h1>\n<p>foo</p>\n<p>google.com</p></span>", array('text' => "#Headline#\nfoo\n[google.com](http://www.google.com)\n\n",
																															   'mode' => 'markdown'));
	}

	public function testModeMarkdownPlain() {
		$this->_assertSame("<span class=\"usertext2 markdownPlain\">Headline\nfoo\n</span>", array('text' => "#Headline#\nfoo\n",
																								   'mode' => 'markdownPlain'));
	}

	public function testMaxLength() {
		$this->_assertSame("<span class=\"usertext2 oneline\">Hello…</span>", array('text' => "Hello World", 'mode' => 'oneline', 'maxLength' => 10));
		$this->_assertSame("<span class=\"usertext2 simple\">Hello…</span>", array('text' => "Hello World", 'mode' => 'simple', 'maxLength' => 10));
		$this->_assertSame("<span class=\"usertext2 markdownPlain\">Hello…</span>", array('text' => "Hello \n\n* World",
																						  'mode' => 'markdownPlain', 'maxLength' => 10));
		try {
			smarty_function_usertext2(array('text' => 'foo', 'mode' => 'markdown', 'maxLength' => 1), $this->_template);
		} catch (CM_Exception_Invalid $ex) {
			$this->assertSame('MaxLength is not allowed in mode markdown.', $ex->getMessage());
		}
	}

	public function testModeNo() {
		try {
			smarty_function_usertext2(array('text' => 'foo'), $this->_template);
		} catch (CM_Exception_Invalid $ex) {
			$this->assertSame('Must define mode in Usertext.', $ex->getMessage());
		}
	}

	private function _assertSame($expected, array $params) {
		$this->assertSame($expected, smarty_function_usertext2($params, $this->_template));
	}
}
