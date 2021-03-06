<?php

abstract class CM_RenderAdapter_Abstract {

    /**
     * @var CM_Render
     */
    private $_render;

    /**
     * @var CM_View_Abstract
     */
    private $_view;

    /**
     * @param CM_Render $render
     * @param           $view
     */
    public function __construct(CM_Render $render, CM_View_Abstract $view) {
        $this->_render = $render;
        $this->_view = $view;
    }

    /**
     * @return CM_Render
     */
    public function getRender() {
        return $this->_render;
    }

    /**
     * @param array $params
     * @return string
     */
    abstract public function fetch(array $params = array());

    /**
     * @param string|null  $tplName
     * @param array|null   $variables
     * @param boolean|null $isolated
     * @param boolean|null $searchAllNamespaces
     * @return string
     */
    protected function _renderTemplate($tplName = null, array $variables = null, $isolated = null, $searchAllNamespaces = null) {
        $tplPath = $this->_getTplPath($tplName, $searchAllNamespaces);
        return $this->getRender()->renderTemplate($tplPath, $variables, $isolated);
    }

    /**
     * Return tpl path
     *
     * First try theme for current component
     * try all themes
     * Then try parents -> for all themes again
     *
     * @param string       $tplName
     * @param boolean|null $searchAllNamespaces
     * @return string
     * @throws CM_Exception
     */
    protected function _getTplPath($tplName, $searchAllNamespaces = null) {
        $tplName = (string) $tplName;
        $searchAllNamespaces = (boolean) $searchAllNamespaces;
        foreach ($this->_getView()->getClassHierarchy() as $className) {
            if (!preg_match('/^([a-zA-Z]+)_([a-zA-Z]+)_(.+)$/', $className, $matches)) {
                throw new CM_Exception('Cannot detect namespace/view-class/view-name for `' . $className . '`.');
            }
            $tpl = $matches[2] . DIRECTORY_SEPARATOR . $matches[3] . DIRECTORY_SEPARATOR . $tplName;
            $namespace = null;
            if (!$searchAllNamespaces) {
                $namespace = $matches[1];
            }
            if ($tplPath = $this->getRender()->getLayoutPath($tpl, $namespace, false, false)) {
                return $tplPath;
            }
        }

        throw new CM_Exception('Cannot find template `' . $tplName . '` for `' . get_class($this->_getView()) . '`.');
    }

    /**
     * @return CM_View_Abstract
     */
    protected function _getView() {
        return $this->_view;
    }
}
