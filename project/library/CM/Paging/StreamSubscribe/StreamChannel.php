<?php

class CM_Paging_StreamSubscribe_StreamChannel extends CM_Paging_StreamSubscribe_Abstract {

	private $_streamChannel;

	/**
	 * @param CM_Model_Stream_Publish $streamChannel
	 */
	public function __construct(CM_Model_StreamChannel_Abstract $streamChannel) {
		$this->_streamChannel = $streamChannel;
		$source = new CM_PagingSource_Sql('`id`', TBL_CM_STREAM_SUBSCRIBE, '`channelId` = ' . $streamChannel->getId());
		$source->enableCache();
		return parent::__construct($source);
	}

	/**
	 * @param array $data
	 * @return CM_Model_Stream_Subscribe
	 */
	public function add(array $data) {
		$data['streamChannel'] = $this->_streamChannel;
		$streamSubscribe = CM_Model_Stream_Subscribe::create($data);
		$this->_change();
		return $streamSubscribe;
	}

	/**
	 * @param CM_Model_Stream_Subscribe $streamSubscribe
	 */
	public function delete(CM_Model_Stream_Subscribe $streamSubscribe) {
		if (!$this->contains($streamSubscribe)) {
			throw new CM_Exception_Invalid("Cannot remove a stream from a channel it doesn't subscribe to.");
		}
		$streamSubscribe->delete();
		$this->_change();
	}
}
