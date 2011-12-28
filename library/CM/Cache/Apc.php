<?php

abstract class CM_Cache_Apc extends CM_Cache_Abstract {
	protected static $_instance;

	protected function _getName() {
		return 'APC';
	}

	protected function _set($key, $data, $lifeTime = null) {
		if (!$lifeTime) {
			$lifeTime = self::_getConfig()->lifetime;
		}
		return apc_store($key, $data, $lifeTime);
	}

	protected function _get($key) {
		return apc_fetch($key);
	}

	protected function _delete($key) {
		return apc_delete($key);
	}

	protected function _flush() {
		return apc_clear_cache('user');
	}

}
