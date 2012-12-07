<?php
require_once __DIR__ . '/../../../TestCase.php';

class CM_Cache_AbstractTest extends TestCase {

	public static function setUpBeforeClass() {
		CM_Config::get()->CM_Cache_Mock = new StdClass();
		CM_Config::get()->CM_Cache_Mock->enabled = true;
	}

	public static function tearDownAfterClass() {
	}

	protected function tearDown() {
		CM_Cache_Mock::flush();
	}

	public function testGetSet() {
		$this->assertSame(false, CM_Cache_Mock::get('foo'));

		CM_Cache_Mock::set('foo', 12);
		$this->assertSame(12, CM_Cache_Mock::get('foo'));
	}

	public function testGetSetInvalidateRuntimeCache() {
		CM_Cache_Mock::set('foo', 13);
		$this->assertSame(13, CM_Cache_Mock::get('foo'));
		CM_Cache_Mock::simulateForgetting('foo');
		$this->assertSame(13, CM_Cache_Mock::get('foo'));
		TH::timeForward(CM_Cache_Abstract::RUNTIME_LIFETIME + 1);
		$this->assertSame(false, CM_Cache_Mock::get('foo'));
	}

	/**
	 * @depends testGetSetInvalidateRuntimeCache
	 */
	public function testGetSetWithLifetime() {
		$lifeTime = 5;
		CM_Cache_Mock::set('foo', 14, $lifeTime);
		$this->assertSame(14, CM_Cache_Mock::get('foo'));
		TH::timeForward($lifeTime + 1);
		$this->assertSame(false, CM_Cache_Mock::get('foo'));
	}
}

class CM_Cache_Mock extends CM_Cache_Abstract {
	protected static $_instance;
	private $_store = array();

	public static function simulateForgetting($key) {
		/** @var CM_Cache_Mock $cache */
		$cache = static::getInstance();
		$cache->_simulateForgetting($key);
	}

	protected function _simulateForgetting($key) {
		unset($this->_store[$key]);
	}

	protected function _set($key, $data, $lifeTime = null) {
		$expirationStamp = null;
		if (null !== $lifeTime) {
			$expirationStamp = time() + (int) $lifeTime;
		}
		$this->_store[$key] = array('data' => $data, 'expirationStamp' => $expirationStamp);
		return true;
	}

	protected function _get($key) {
		if (!array_key_exists($key, $this->_store)) {
			return false;
		}
		$entry = $this->_store[$key];
		if (null !== $entry['expirationStamp'] && time() > $entry['expirationStamp']) {
			return false;
		}
		return $entry['data'];
	}

	protected function _delete($key) {
		unset($this->_store[$key]);
		return true;
	}

	protected function _flush() {
		$this->_store = array();
		return true;
	}

	protected function _getName() {
		return 'Mock Cache';
	}
}