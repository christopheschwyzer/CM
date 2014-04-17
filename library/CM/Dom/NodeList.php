<?php

class CM_Dom_NodeList implements Iterator, Countable {

    /** @var int */
    private $_iteratorPosition = 0;

    /** @var DOMDocument */
    private $_doc;

    /** @var DOMNode[] */
    private $_elementList = array();

    /** @var DOMXPath */
    private $_xpath;

    /**
     * @param string|DOMElement[] $html
     * @param bool|null           $ignoreErrors
     * @throws CM_Exception_Invalid
     */
    public function __construct($html, $ignoreErrors = null) {
        if (is_array($html)) {
            foreach ($html as $element) {
                if (!$element instanceof DOMNode) {
                    throw new CM_Exception_Invalid('Not all elements are DOMNode');
                }
                $this->_elementList[] = $element;
                if (!$this->_doc) {
                    $this->_doc = $element->ownerDocument;
                }
            }
        } else {
            $html = (string) $html;

            if (empty($html)) {
                throw new CM_Exception_Invalid('Cant create elementList from empty string');
            }

            $this->_doc = new DOMDocument();
            $html = '<?xml version="1.0" encoding="UTF-8"?>' . $html;

            $libxmlUseErrorsBackup = libxml_use_internal_errors(true);
            $this->_doc->loadHTML($html);
            $errors = libxml_get_errors();
            if (!empty($errors)) {
                libxml_clear_errors();
                if (!$ignoreErrors) {
                    $errorMessages = array_map(function (libXMLError $error) {
                        return trim($error->message);
                    }, $errors);
                    throw new CM_Exception_Invalid('Cannot load html: ' . implode(', ', $errorMessages));
                }
            }
            libxml_use_internal_errors($libxmlUseErrorsBackup);

            $this->_elementList[] = $this->_doc->documentElement;
        }
    }

    /**
     * @param int|null $filterType
     * @return CM_Dom_NodeList
     */
    public function getChildren($filterType = null) {
        $childNodeList = array();
        foreach ($this->_elementList as $element) {
            foreach ($element->childNodes as $childNode) {
                if (null === $filterType || $childNode->nodeType === $filterType) {
                    $childNodeList[] = $childNode;
                }
            }
        }
        return new self($childNodeList);
    }

    /**
     * @return string
     */
    public function getText() {
        $text = '';
        foreach ($this->_elementList as $element) {
            $text .= $element->textContent;
        }
        return $text;
    }

    /**
     * @return string
     */
    public function getHtml() {
        $html = '';
        foreach ($this->_elementList as $element) {
            $html .= $this->_doc->saveHTML($element);
        }
        return $html;
    }

    /**
     * @param string $name
     * @return string|null
     */
    public function getAttribute($name) {
        $attributes = $this->getAttributeList();
        if (!isset($attributes[$name])) {
            return null;
        }
        return $attributes[$name];
    }

    /**
     * @return string[]
     */
    public function getAttributeList() {
        $attributeList = array();
        if (!isset($this->_elementList[0])) {
            return $attributeList;
        }
        foreach ($this->_elementList[0]->attributes as $key => $attrNode) {
            $attributeList[$key] = $attrNode->value;
        }
        return $attributeList;
    }

    /**
     * @param string $selector
     * @return CM_Dom_NodeList
     */
    public function find($selector) {
        $elements = $this->_findAll($selector);
        return new self($elements);
    }

    /**
     * @param string $selector
     * @return bool
     */
    public function has($selector) {
        $elements = $this->_findAll($selector);
        return (count($elements) > 0);
    }

    /**
     * @return DOMXPath
     */
    private function _getXPath() {
        if (!$this->_xpath) {
            $this->_xpath = new DOMXPath($this->_doc);
        }
        return $this->_xpath;
    }

    /**
     * @param string $selector
     * @throws CM_Exception_Invalid
     * @return DOMElement[]
     */
    private function _findAll($selector) {
        $xpath = '//' . preg_replace('-([^>\s])\s+([^>\s])-', '$1//$2', trim($selector));
        $xpath = preg_replace('/([^\s]+)\s*\>\s*([^\s]+)/', '$1/$2', $xpath);
        $xpath = preg_replace('/\[([^~=\[\]]+)~="([^~=\[\]]+)"\]/', '[contains(concat(" ",@$1," "),concat(" ","$2"," "))]', $xpath);
        $xpath = preg_replace('/\[([^~=\[\]]+)="([^~=\[\]]+)"\]/', '[@$1="$2"]', $xpath);
        $xpath = preg_replace('/\[([\w-]+)\]/', '[@$1]', $xpath);
        $xpath = str_replace(':last', '[last()]', str_replace(':first', '[1]', $xpath));
        $xpath = preg_replace_callback('/:eq\((\d+)\)/', function ($matches) {
            return '[' . ($matches[1] + 1) . ']';
        }, $xpath);
        $xpath = preg_replace('/\.([\w-]*)/', '[contains(concat(" ",@class," "),concat(" ","$1"," "))]', $xpath);
        $xpath = preg_replace('/#([\w-]*)/', '[@id="$1"]', $xpath);
        $xpath = preg_replace('-\/\[-', '/*[', $xpath);
        $nodes = array();
        foreach ($this->_elementList as $element) {
            foreach ($this->_getXPath()->query('.' . $xpath, $element) as $resultElement) {
                if (!$resultElement instanceof DOMElement) {
                    throw new CM_Exception_Invalid('Xpath query does not return DOMElement');
                }
                $nodes[] = $resultElement;
            }
        }
        return $nodes;
    }

    public function current() {
        return new self(array($this->_elementList[$this->_iteratorPosition]));
    }

    public function next() {
        $this->_iteratorPosition++;
    }

    public function key() {
        return $this->_iteratorPosition;
    }

    public function valid() {
        return isset($this->_elementList[$this->_iteratorPosition]);
    }

    public function rewind() {
        $this->_iteratorPosition = 0;
    }

    public function count() {
        return count($this->_elementList);
    }
}
