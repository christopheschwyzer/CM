<?php

class CM_Paging_StreamPublish_StreamChannel extends CM_Paging_StreamPublish_Abstract {

	private $_streamChannel;

	/**
	 * @param CM_Model_StreamChannel_Abstract $streamChannel
	 */
	public function __construct(CM_Model_StreamChannel_Abstract $streamChannel) {
		$this->_streamChannel = $streamChannel;
		$source = new CM_PagingSource_Sql('id', TBL_CM_STREAM_PUBLISH, '`channelId` = ' . $this->_streamChannel->getId());
		$source->enableCache();
		parent::__construct($source);
	}

	/**
	 * @param string $key
	 * @return CM_Model_Stream_Publish|null
	 */
	public function findKey($key) {
		$key = (string) $key;
		/** @var CM_Model_Stream_Publish $streamPublish */
		foreach($this as $streamPublish) {
			if ($streamPublish->getKey() == $key) {
				return $streamPublish;
			}
		}
		return null;
	}
}
